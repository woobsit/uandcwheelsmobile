const { Router } = require('express');
const {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  verifyEmailByCodeValidators,
  resendVerificationValidators

} = require('../middlewares/validators/auth.validators');
const { validateRequest } = require('../middlewares/validate-request');
const {
  register,
  login,
  verifyEmail,
  verifyEmailByCode,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/auth/auth');
const { authLimiter } = require('./../middlewares/rateLimiter');

const router = Router();

router.post('/register', registerValidators, validateRequest, register);

router.post('/login', authLimiter, loginValidators, validateRequest, login);

router.get('/verify-email', verifyEmailValidators, validateRequest, verifyEmail);

router.post('/verify-email', verifyEmailByCodeValidators, validateRequest,verifyEmailByCode); // For mobile

router.post('/resend-verification', resendVerificationValidators, validateRequest,resendVerification);

router.post('/forgot-password', forgotPasswordValidators, validateRequest, forgotPassword);

router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidators,
  validateRequest,
  resetPassword,
);

router.post('/logout', logout);

const authRouter = router;
module.exports = { authRouter };
