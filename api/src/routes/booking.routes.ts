import { Router } from 'express';
import passport from 'passport';
import * as bookingController from '../controllers/booking';
import * as validations from '../validations/booking.validations';

const router = Router();

// Public routes
router.get('/trips', validations.searchTripsValidations, bookingController.searchTrips);

// Protected routes
router.use(passport.authenticate('jwt', { session: false }));

router.post('/bookings', validations.createBookingValidations, bookingController.createBooking);
router.get('/bookings', bookingController.getUserBookings);
router.get('/bookings/:id', bookingController.getBookingDetails);

export default router;