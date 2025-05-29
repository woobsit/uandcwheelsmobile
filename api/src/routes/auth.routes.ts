import { Router } from 'express';
import { body } from 'express-validator';
import { AuthService } from '../auth/services/auth.service';
import { validateRequest } from '../middlewares/validate-request';

const router = Router();

router.post('/register', 
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage('Password must be between 6 and 20 characters')
  ],
  validateRequest,
  async (req, res) => {
    const { email, password } = req.body;
    const user = await AuthService.register(email, password);
    res.status(201).send(user);
  }
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').trim().notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  async (req, res) => {
    const { email, password } = req.body;
    const { token, user } = await AuthService.login(email, password);
    res.send({ token, user });
  }
);

export { router as authRouter };