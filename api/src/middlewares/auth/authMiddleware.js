// middlewares/auth/authMiddleware.js
const passport = require('passport');

// This middleware requires a valid Access Token for access.
// If the token is invalid or expired, Passport returns 401.
const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = { requireAuth };