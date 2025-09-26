// routes/booking.js

const { Router } = require('express');
const passport = require('passport');
const { createBooking, getUserBookings } = require('../controllers/booking');
const { createBookingValidations } = require('../middlewares/validators/booking.validator');
const { validateRequest } = require('../middlewares/validate-request');

const router = Router();

// Public route for guest users. No authentication middleware is applied here.
router.post('/book-bus', createBookingValidations, validateRequest, createBooking);

// Protected routes. The authentication middleware is applied to this specific route.
router.get(
  '/user-bookings',
  passport.authenticate('jwt', { session: false }),
  getUserBookings
);

const bookingRouter = router;
module.exports = { bookingRouter };