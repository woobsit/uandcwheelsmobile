import { Router } from 'express';
import { registerValidators, loginValidators, verifyEmailValidators, forgotPasswordValidators, resetPasswordValidators } from '../middlewares/input-validators';
import { validateRequest } from '../middlewares/validate-request';
import { register, login, verifyEmail, forgotPassword, resetPassword } from '../controllers/auth/auth';
import { authLimiter  } from './../middlewares/rateLimiter';


const router = Router();

router.post('/register', 
  registerValidators,
  validateRequest,
  register
);

router.post('/login',
  authLimiter,
loginValidators,
  validateRequest,
  login
);

router.post('/verifyEmail',
verifyEmailValidators,
  validateRequest,
  verifyEmail
);

router.post('/forgot-password', 
  forgotPasswordValidators,
  validateRequest,
  forgotPassword
);

router.post('/reset-password',
    authLimiter,
  resetPasswordValidators,
  validateRequest,
  resetPassword
);

export { router as authRouter };