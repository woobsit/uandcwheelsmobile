import { Router } from 'express';
import passport from 'passport';
import {getCurrentUser, updateProfile} from '../controllers/user';
import { updateProfileValidations } from '../middlewares/input-validators';

const router = Router();

// Protect all routes with JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

// GET /api/v1/users/me - Get current user profile
router.get('/me', getCurrentUser);

// PATCH /api/v1/users/profile - Update user profile
router.patch('/profile', updateProfileValidations, updateProfile);

export default router;