const { Strategy, ExtractJwt } = require('passport-jwt');
const db = require('../../models/index'); // Your Sequelize models

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_fallback_secret',
  passReqToCallback: true,
};

const jwtStrategy = new Strategy(options, async (req, payload, done) => {
  try {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      return done(null, false, { message: 'No token provided' });
    }

    // Check if token is revoked
    const revokedToken = await db.RevokedToken.findOne({
      where: { token },
      attributes: ['id'], // Only fetch what we need
    });

    if (revokedToken) {
      return done(null, false, { message: 'Token revoked' });
    }

    // Find user without password field
    const user = await db.User.findByPk(payload.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});

module.exports = { jwtStrategy };
