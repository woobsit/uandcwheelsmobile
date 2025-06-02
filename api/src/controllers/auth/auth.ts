// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../../models';
import EmailService from '../../email/email.service';
import { generateToken } from '../../utils/auth.utils';
import logger from '../../config/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists (normal flow, not an error)
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
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

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Registration failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your inbox.'
      });
    }

    const payload = { id: user.id, email: user.email };
    const token = generateToken(payload);

    // Omit sensitive fields
    const { password: _, verification_token, ...userData } = user.get({ plain: true });
    
    logger.info(`User logged in: ${email}`, { userId: user.id });

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await db.User.findOne({ where: { verification_token: token } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    await user.update({
      email_verified_at: new Date(),
      verification_token: null
    });

    logger.info(`Email verified for user: ${user.email}`, { userId: user.id });

    return res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    logger.error('Email verification failed', { 
      token: req.query.token,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during email verification'
    });
  }
};