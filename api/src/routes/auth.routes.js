const { Router } = require('express');
const {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  forgotPasswordValidators,
  //verifyResetCodeValidators,
  resetPasswordValidators,
  resendVerificationValidators,
} = require('../middlewares/validators/auth.validators');
const { validateRequest } = require('../middlewares/validate-request');
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  //verifyResetCode,
  resetPassword,
  logout,
} = require('../controllers/auth/auth');
const { authLimiter } = require('./../middlewares/rateLimiter');

const router = Router();

router.post('/register', registerValidators, validateRequest, register);

router.post('/login', authLimiter, loginValidators, validateRequest, login);

router.post('/verify-email', verifyEmailValidators, validateRequest, verifyEmail);

router.post(
  '/resend-verification',
  resendVerificationValidators,
  validateRequest,
  resendVerification,
);

router.post('/forgot-password', forgotPasswordValidators, validateRequest, forgotPassword);

//router.post('/verify-reset-code', verifyResetCodeValidators, validateRequest, verifyResetCode);

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
