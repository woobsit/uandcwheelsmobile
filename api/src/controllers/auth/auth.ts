import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../../models';
import EmailService from '../../email/email.service';
import { generateToken } from '../../auth/utils/auth.utils';
import logger from '../../config/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();
    
    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      email_verified_at: null,
      verification_token: verificationToken
    });

    await EmailService.sendVerificationEmail(email, name, verificationToken);

    logger.info(`New user registered: ${email}`, { userId: user.id });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        hashed: hashedPassword
      }
    });
  } catch (error) {
    logger.error('Registration failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, remember_token = false } = req.body;
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    if (!user.email_verified_at) {
      res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your inbox.'
      });
      return;
    }

 const tokenExpiration = remember_token ? '30d' : '1d'; 
    const payload = { id: user.id, email: user.email };
    const token = generateToken(payload, tokenExpiration);

    const { password: _, verification_token, ...userData } = user.get({ plain: true });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { 
        token, 
        user: userData 
      }
    });
  } catch (error) {
    logger.error('Login failed', { 
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
      return;
    }

    const user = await db.User.findOne({ where: { verification_token: token } });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Invalid verification token'
      });
      return;
    }

    await user.update({
      email_verified_at: new Date(),
      verification_token: null
    });

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    logger.error('Email verification failed', { 
      token: req.query.token,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification'
    });
  }
};