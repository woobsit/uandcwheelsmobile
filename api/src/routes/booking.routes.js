const { Router } = require('express');
const passport = require('passport');
const { createBooking, getUserBookings } = require('../controllers/booking');
const { createBookingValidations } = require('../middlewares/validators/booking.validator');
const { validateRequest } = require('../middlewares/validate-request');

const router = Router();

// Protected routes
router.use(passport.authenticate('jwt', { session: false }));

router.post('/book-bus', createBookingValidations, validateRequest, createBooking);
router.get('/user-bookings', getUserBookings);


const bookingRouter = router;
module.exports = { bookingRouter };
