// middlewares/auth/jwt.strategy.js
const { Strategy, ExtractJwt } = require('passport-jwt');
const db = require('../../models/index');
const { Op } = require('sequelize');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET || 'access-secret',
  passReqToCallback: true,
  ignoreExpiration: false, // Use passport-jwt's built-in expiration check
};

const jwtStrategy = new Strategy(options, async (req, payload, done) => {
  try {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      return done(null, false, {
        code: 'MISSING_TOKEN',
        message: 'No authentication token provided',
      });
    }

    // 1. Check token revocation
    const revokedToken = await db.RevokedToken.findOne({
      where: {
        token,
        expires_at: { [Op.gt]: new Date() }, // Only check non-expired revocations
      },
      attributes: ['id'],
    });

    if (revokedToken) {
      return done(null, false, {
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked',
      });
    }

    // 2. Verify user exists
    const user = await db.User.findByPk(payload.id, {
      attributes: { exclude: ['password'] },
      raw: true,
    });

    if (!user) {
      return done(null, false, {
        code: 'USER_NOT_FOUND',
        message: 'User account does not exist',
      });
    }

const userWithClaims = {
  ...user,    // Includes id, name, email, etc.
  ...payload, // Includes id and email from token (no change here)
  exp: payload.exp, // Explicitly grab 'exp' from the token payload
  iat: payload.iat  // Explicitly grab 'iat' from the token payload
};

    // 3. Attach user to request
    req.user = userWithClaims;

    return done(null, userWithClaims);
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return done(null, false, {
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return done(null, false, {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      });
    }

    // Log other errors
    console.error('JWT Verification Error:', error.message);
    return done(null, false, {
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
    });
  }
});

module.exports = { jwtStrategy };
