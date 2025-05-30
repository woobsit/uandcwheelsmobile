import { Router } from 'express';
import { Request, Response } from 'express';
import { registerValidators, loginValidators } from '../middlewares/input-validators';
import { AuthService } from '../auth/services/auth.service';
import { validateRequest } from '../middlewares/validate-request';

const router = Router();

router.post('/register', 
  registerValidators,
  validateRequest,
  async (req : Request, res: Response,) => {
    const {name, email, password } = req.body;
    const user = await AuthService.register(name, email, password);
    res.status(201).send(user);
  }
);

router.post('/login',
loginValidators,
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { token, user } = await AuthService.login(email, password);
    res.send({ token, user });
  }
);

export { router as authRouter };