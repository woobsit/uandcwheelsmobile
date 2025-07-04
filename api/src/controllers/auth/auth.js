const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const db = require('../../models/index');
//const EmailService = require( '../../email/email.service');
const PasswordResetToken = require('../../models/passwordResetToken.model');
const { generateToken } = require('../../middlewares/auth/verify');
const logger = require('../../config/logger');
const { Op } = require('sequelize');
//const dbInstance = require('../../config/config');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
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
      verification_token_expires: verificationExpires,
    });

    //await EmailService.sendVerificationEmail(email, name, verificationToken, verificationExpires);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
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
        message: 'Email not verified. Please check your inbox.',
      });
    }

    const tokenExpiration = remember_token ? '30d' : '1d';
    // Generate tokens
    const payload = { id: user.id, email: user.email };
    const accessToken = generateToken(payload, 'access');
    const refreshToken = generateToken(payload, 'refresh');

    // Store refresh token in DB
    await db.RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const { password: _, ...userData } = user.get({ plain: true });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken, // Send to client
        user: userData,
      },
    });
  } catch (error) {
    logger.error('Login failed', {
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify token
    const decoded = verifyToken(refreshToken, 'refresh');

    // Check DB for valid token
    const tokenRecord = await db.RefreshToken.findOne({
      where: {
        token: refreshToken,
        userId: decoded.id,
        revoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Generate new access token
    const payload = { id: decoded.id, email: decoded.email };
    const newAccessToken = generateToken(payload, 'access');

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    logger.error('Refresh token error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    const user = await db.User.findOne({ where: { verification_token: token } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token',
      });
    }

    // Check if token has expired
    if (user.verification_token_expires && new Date() > user.verification_token_expires) {
      await user.destroy(); // Optional: Clean up expired registration
      return res.status(410).json({
        // 410 Gone
        success: false,
        message: 'Verification link has expired. Please register again.',
      });
      return;
    }

    await user.update({
      email_verified_at: new Date(),
      verification_token: null,
      verification_token_expires: null,
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    logger.error('Email verification failed', {
      token: req.query.token,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during email verification',
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      // Security: Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    }

    // Generate token and store in separate table
    const token = uuid.v4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Upsert token (update or create)
    await PasswordResetToken.upsert({
      email,
      token,
      created_at: new Date(),
    });

    // await EmailService.sendPasswordResetEmail(
    //   user.email,
    //   user.name,
    //   token,
    //   expiresAt
    // );

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    logger.error('Forgot password failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
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
          [Op.gt]: new Date(Date.now() - 60 * 60 * 1000), // Created within last hour
        },
      },
    });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Find associated user
    const user = await db.User.findOne({
      where: { email: tokenRecord.email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await user.update({ password: hashedPassword });

    // Delete the used token
    await PasswordResetToken.destroy({
      where: { email: tokenRecord.email },
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    logger.error('Password reset failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};
// New Logout Endpoint
const logout = async (req, res) => {
  // Start transaction
  const transaction = await db.sequelize.transaction();

  try {
    // 1. Validate authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await transaction.rollback();
      return res.status(401).json({ error: 'Invalid authorization header' });
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      await transaction.rollback();
      return res.status(401).json({ error: 'Malformed token' });
    }

    // 2. Validate user payload
    if (!req.user || !req.user.id || !req.user.exp) {
      await transaction.rollback();
      return res.status(401).json({ error: 'Invalid user session' });
    }

    const expiresAt = new Date(req.user.exp * 1000);

    // 3. Get refresh token from request
    const { refreshToken } = req.body;
    if (!refreshToken) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // 4. Perform all revocations in transaction
    // Revoke access token
    await db.RevokedToken.create(
      {
        token: accessToken,
        expires_at: expiresAt,
        user_id: req.user.id,
      },
      { transaction },
    );

    // Revoke refresh token
    await db.RefreshToken.update(
      { revoked: true },
      {
        where: {
          token: refreshToken,
          userId: req.user.id, // Security: ensure token belongs to user
        },
        transaction,
      },
    );

    // 5. Commit transaction
    await transaction.commit();

    // 6. Client-side cleanup instructions
    return res.status(200).set('Clear-Site-Data', '"cookies", "storage"').json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    // Rollback on any error
    if (transaction) await transaction.rollback();

    logger.error('Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      error: 'Logout failed',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
};
