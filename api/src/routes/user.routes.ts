import { Router } from 'express';
import passport from 'passport';
import {getCurrentUser, updateProfile} from '../controllers/user';
import { updateProfileValidations } from '../middlewares/input-validators';

const userRouter = Router();

// Protect all routes with JWT authentication
userRouter.use(passport.authenticate('jwt', { session: false }));

// GET /api/v1/users/me - Get current user profile
userRouter.get('/me', getCurrentUser);

// PATCH /api/v1/users/profile - Update user profile
userRouter.patch('/profile', updateProfileValidations, updateProfile);

export {userRouter};