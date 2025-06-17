const { Router } = require( 'express');
const passport = require( 'passport');
const {searchTrips, createBooking, getUserBookings, getBookingDetails} = require( '../controllers/booking');
const { searchTripsValidations, createBookingValidations } = require( '../middlewares/input-validators');

const router = Router();

// Public routes
router.get('/trips', searchTripsValidations, searchTrips);

// Protected routes
router.use(passport.authenticate('jwt', { session: false }));

router.post('/bookings', createBookingValidations, createBooking);
router.get('/bookings', getUserBookings);
router.get('/bookings/:id', getBookingDetails);

const bookingRouter = router;
module.exports = {bookingRouter};