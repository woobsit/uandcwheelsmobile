import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../../models';
import EmailService from '../../email/email.service';
import PasswordResetToken from '../../models/passwordResetToken.model';
import { generateToken } from '../../middlewares/auth/verify';
import logger from '../../config/logger';
import { Op } from 'sequelize';


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
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      email_verified_at: null,
      verification_token: verificationToken,
      verification_token_expires: verificationExpires
    });

   
    await EmailService.sendVerificationEmail(email, name, verificationToken, verificationExpires);

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
    
    res.status(200).json({
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

      // Check if token has expired
    if (user.verification_token_expires && new Date() > user.verification_token_expires) {
      await user.destroy(); // Optional: Clean up expired registration
      res.status(410).json({ // 410 Gone
        success: false,
        message: 'Verification link has expired. Please register again.'
      });
      return;
    }

    await user.update({
      email_verified_at: new Date(),
      verification_token: null,
      verification_token_expires: null
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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      // Security: Don't reveal if email exists
      res.json({
        success: true,
        message: 'If an account exists, you will receive a password reset link'
      });
      return;
    }

    // Generate token and store in separate table
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration
    
    // Upsert token (update or create)
    await PasswordResetToken.upsert({
      email,
      token,
      created_at: new Date()
    });

    await EmailService.sendPasswordResetEmail(
      user.email,
      user.name,
      token,
      expiresAt
    );

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    logger.error('Forgot password failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    
    // Find token record
    const tokenRecord = await PasswordResetToken.findOne({ 
      where: { 
        token,
        created_at: { 
          [Op.gt]: new Date(Date.now() - 60 * 60 * 1000) // Created within last hour
        } 
      }
    });

    if (!tokenRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
      return;
    }

    // Find associated user
    const user = await db.User.findOne({ 
      where: { email: tokenRecord.email }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await user.update({ password: hashedPassword });

    // Delete the used token
    await PasswordResetToken.destroy({ 
      where: { email: tokenRecord.email } 
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Password reset failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
}
  // New Logout Endpoint
export const logout = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });

};