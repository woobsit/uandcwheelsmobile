const { Router } = require( 'express');
const passport = require( 'passport');
const {getCurrentUser, updateProfile} = require( '../controllers/user');
const { updateProfileValidations } = require( '../middlewares/input-validators');

const userRouter = Router();

// Protect all routes with JWT authentication
userRouter.use(passport.authenticate('jwt', { session: false }));

// GET /api/v1/users/me - Get current user profile
userRouter.get('/me', getCurrentUser);

// PATCH /api/v1/users/profile - Update user profile
userRouter.patch('/profile', updateProfileValidations, updateProfile);

module.exports = {userRouter};