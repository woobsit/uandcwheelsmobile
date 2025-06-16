const { Router } = require( 'express');
const passport = require( 'passport');
const * as bookingController = require( '../controllers/booking');
const { searchTripsValidations, createBookingValidations } = require( '../middlewares/input-validators');

const router = Router();

// Public routes
router.get('/trips', searchTripsValidations, bookingController.searchTrips);

// Protected routes
router.use(passport.authenticate('jwt', { session: false }));

router.post('/bookings', createBookingValidations, bookingController.createBooking);
router.get('/bookings', bookingController.getUserBookings);
router.get('/bookings/:id', bookingController.getBookingDetails);

const bookingRouter = router;
module.exports = {bookingRouter};