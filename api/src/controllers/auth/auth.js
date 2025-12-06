const bcrypt = require('bcryptjs');
const db = require('../../models/index');
const EmailService = require('../../email/email.service');
const PasswordResetToken = require('../../models/passwordResetToken.model');
const { generateToken, verifyToken } = require('../../middlewares/auth/verify');
const logger = require('../../config/logger');
const { Op } = require('sequelize');
//const dbInstance = require('../../config/config');

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.json({
        status: 409,
        success: false,
        message: 'This email is already registered.',
      });
    }

    //const verificationToken = uuid.v4();
    const verificationCode = generateVerificationCode();
    // Change to 15 minutes (15 * 60 * 1000)
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await db.User.create({
      name,
      email: email.toLowerCase(),
      password,
      email_verified_at: null,
      verification_code: verificationCode,
      verification_token_expires: verificationExpires,
    });

    await EmailService.sendVerificationEmail(email, name, verificationCode, verificationExpires);

    return res.json({
      status: 201,
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    logger.error('Registration failed', error);
    return res.json({
      status: 500,
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        status: 401,
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        status: 401,
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.email_verified_at) {
      return res.json({
        status: 403,
        success: false,
        message: 'Email not verified. Please check your inbox.',
      });
    }

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
    // Calculate expiration time in milliseconds (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    // 2. Set the Refresh Token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Crucial: Prevents client-side JS access
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // Recommended for security
      maxAge: maxAge, // Expiration time
    });

    return res.json({
      status: 200,
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        //refreshToken, // Send to client
        user: userData,
      },
    });
  } catch (error) {
    logger.error('Login failed', {
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.json({
      status: 500,
      success: false,
      message: 'Internal server error during login',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // Read the token name you set in res.cookie

    if (!refreshToken) {
      return res.json({
        status:400,
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
      return res.json({
        status: 401,
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Generate new access token
    const payload = { id: decoded.id, email: decoded.email };
    const newAccessToken = generateToken(payload, 'access');

    return res.json({
      success: 200,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.json({
        status:401,
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    logger.error('Refresh token error', { error: error.message });
    return res.json({
      status:500,
      success: false,
      message: 'Internal server error',
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const numericCode = parseInt(code, 10); // Convert to number

    if (!email || !code) {
      return res.json({
        status: 400,
        success: false,
        message: 'Email and verification code are required',
      });
    }

    const user = await db.User.findOne({
      where: {
        email,
        verification_code: numericCode,
        verification_token_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.json({
        status: 404,
        success: false,
        message: 'Invalid email or verification code',
      });
    }

    await user.update({
      email_verified_at: new Date(),
      verification_code: null,
      verification_token_expires: null,
    });

    return res.json({
      status: 200,
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    logger.error('Email verification failed', error);
    return res.json({
      status: 500,
      success: false,
      message: 'Internal server error during email verification',
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.User.findOne({
      where: { email },
    });

    if (!user) {
      return res.json({
        status: 200,
        success: true,
        message: 'If the email is registered, a new verification will be sent',
      });
    }

    if (user.email_verified_at) {
      return res.json({
        status: 400,
        success: false,
        message: 'Email is already verified',
      });
    }

    //const verificationToken = uuid.v4();
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.update({
      //verification_token: verificationToken,
      verification_code: verificationCode,
      verification_token_expires: verificationExpires,
    });

    await EmailService.sendVerificationEmail(
      email,
      user.name,
      //verificationToken,
      verificationCode,
      verificationExpires,
    );

    return res.json({
      status: 200,
      success: true,
      message: 'New verification email sent',
    });
  } catch (error) {
    logger.error('Resend verification failed', error);
    return res.json({
      status: 500,
      success: false,
      message: 'Failed to resend verification',
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      // Security: Don't reveal if email exists
      return res.json({
        status: 200,
        success: true,
        message: 'Password reset link sent to your email',
      });
    }

    // Generate token and store in separate table
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Change to 15 minutes (15 * 60 * 1000)

    // Upsert token (update or create)
    await PasswordResetToken.upsert({
      email,
      code,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    await EmailService.sendPasswordResetEmail(user.email, user.name, code, expiresAt);

    return res.json({
      status: 200,
      success: true,
      message: 'A password reset code has been sent to your email.',
    });
  } catch (error) {
    logger.error('Forgot password failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.json({
      status: 500,
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    // Find token record
    const tokenRecord = await PasswordResetToken.findOne({
      where: {
        email,
        code,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      return res.json({
        status: 400,
        success: false,
        message: 'Invalid or expired reset code',
      });
    }

    // Find associated user
    const user = await db.User.findOne({
      where: { email },
    });

    if (!user) {
      return res.json({
        status: 400,
        success: false,
        message: 'User not found',
      });
    }

    // Update password
    await user.update({ password: password });

    // Delete the used token
    await PasswordResetToken.destroy({
      where: { email },
    });

    return res.json({
      status: 200,
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    logger.error('Password reset failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.json({
      status: 500,
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
      return res.json({ status: 401, message: 'Invalid authorization header' });
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      await transaction.rollback();
      return res.json({ status: 401, message: 'Malformed token' });
    }

    // 2. Validate user payload
    if (!req.user || !req.user.id || !req.user.exp) {
      await transaction.rollback();
      return res.json({ status: 401, message: 'Invalid user session' });
    }

    const expiresAt = new Date(req.user.exp * 1000);

    // 3. Get refresh token from request
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
    
      await transaction.rollback();
      return res.json({ status: 400, message: 'Refresh token required' });
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

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    // 6. Client-side cleanup instructions
    return res.set('Clear-Site-Data', '"cookies", "storage"').json({
      status: 200,
      message: 'Logged out successfully',
    });
  } catch (error) {
    // Rollback on any error
    if (transaction) await transaction.rollback();

    logger.error('Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.json({
      status: 500,
      message: 'Logout failed',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  //verifyResetCode,
  resetPassword,
  logout,
};
