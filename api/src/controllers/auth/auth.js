const bcrypt = require( 'bcryptjs');
const uuid  = require('uuid');
const db = require( '../../models/index');
const EmailService = require( '../../email/email.service');
const PasswordResetToken = require( '../../models/passwordResetToken.model');
const { generateToken } = require( '../../middlewares/auth/verify');
const logger = require( '../../config/logger');
const { Op } = require( 'sequelize');
const dbInstance = require('../../config/config');


const register = async (req, res) => {
  try {
    
    const { name, email, password } = req.body;

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
     return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

     const verificationToken = uuid.v4();
     const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

     const user = await db.User.create({
       name,
       email,
       password,
       email_verified_at: null,
       verification_token: verificationToken,
       verification_token_expires: verificationExpires
     });

   
     //await EmailService.sendVerificationEmail(email, name, verificationToken, verificationExpires);

    return res.status(201).json({
       success: true,
       message: 'Registration successful. Please check your email to verify your account.',
       data: {
         id: user.id,
         name: user.name,
         email: user.email,
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

 const login = async (req, res) => {
  try {
    const { email, password, remember_token = false } = req.body;
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
    return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
     return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.email_verified_at) {
     return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your inbox.'
      });
    }

 const tokenExpiration = remember_token ? '30d' : '1d'; 
    const payload = { id: user.id, email: user.email };
    const token = generateToken(payload, tokenExpiration);
    const { password: _, verification_token, ...userData } = user.get({ plain: true });
    
   return res.status(200).json({
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

 const verifyEmail = async (req, res) => {
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

      // Check if token has expired
    if (user.verification_token_expires && new Date() > user.verification_token_expires) {
      await user.destroy(); // Optional: Clean up expired registration
     return res.status(410).json({ // 410 Gone
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

  return res.status(200).json({
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

 const forgotPassword = async (req, res)=> {
  try {
    const { email } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      // Security: Don't reveal if email exists
    return res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email'
      });
      
    }

    // Generate token and store in separate table
    const token = uuid.v4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration
    
    // Upsert token (update or create)
    await PasswordResetToken.upsert({
      email,
      token,
      created_at: new Date()
    });

    // await EmailService.sendPasswordResetEmail(
    //   user.email,
    //   user.name,
    //   token,
    //   expiresAt
    // );

   return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    logger.error('Forgot password failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
   return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

 const resetPassword = async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
     
    }

    // Find associated user
    const user = await db.User.findOne({ 
      where: { email: tokenRecord.email }
    });

    if (!user) {
      return res.status(400).json({
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

   return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Password reset failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
   return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
}
  // New Logout Endpoint
 const logout = async (req, res) => {
  try {
    // Validate authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed token' });
    }

    // Validate user payload
    if (!req.user || !req.user.exp) {
      return res.status(401).json({ error: 'Invalid user session' });
    }

    const expiresAt = new Date(req.user.exp * 1000);

    // Use transaction for safety
    await db.sequelize.transaction(async (t) => {
      await db.RevokedToken.create({
        token,
        expires_at: expiresAt,
        user_id: req.user.id
      }, { transaction: t });
    });

    // Optional: Tell client to clear storage
    res.setHeader('Clear-Site-Data', '"cookies", "storage"');

    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });

  } catch (error) {
    logger.error('Logout error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json({ 
      error: 'Logout failed'
    });
  }
};

module.exports = {register, login, verifyEmail, forgotPassword, resetPassword, logout}