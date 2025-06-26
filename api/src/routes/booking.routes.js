const { Router } = require('express');
const passport = require('passport');
const { searchTrips, createBooking, getUserBookings } = require('../controllers/booking');
const {
  searchTripsValidations,
  createBookingValidations,
} = require('../middlewares/input-validators');
const { validateRequest } = require('../middlewares/validate-request');

const router = Router();

// Public routes
router.get('/search', searchTripsValidations, validateRequest, searchTrips);

// Protected routes
router.use(passport.authenticate('jwt', { session: false }));

router.post('/create', createBookingValidations, validateRequest, createBooking);
router.get('/user-bookings', getUserBookings);

const bookingRouter = router;
module.exports = { bookingRouter };
