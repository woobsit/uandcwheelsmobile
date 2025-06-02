import { Router } from 'express';
import { registerValidators, loginValidators } from '../middlewares/input-validators';
import { validateRequest } from '../middlewares/validate-request';
import { register, login } from '../controllers/auth/auth';

const router = Router();

router.post('/register', 
  registerValidators,
  validateRequest,
  register
);

router.post('/login',
loginValidators,
  validateRequest,
  login
);

export { router as authRouter };