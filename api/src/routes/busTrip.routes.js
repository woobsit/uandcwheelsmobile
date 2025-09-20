// src/routes/trip.routes.js
const { Router } = require('express');
const {
  createBusTrip,
  getAllAvailableBusTrips,
  getAvailableDatesForRoute,
  getBusTripById,
  updateBusTrip,
  deleteBusTrip,
  getAvailableBusesForDate,
  getBusTripDetails
} = require('../controllers/busTrip');
const { validateRequest } = require('../middlewares/validate-request');
const {
  createBusTripValidator,
  updateBusTripValidator,
  busTripIdValidator,
  getAllAvailableBusTripsValidator,
  getAvailableBusesForRouteValidator,
  getAvailableDatesForRouteValidator,
  getBusTripDetailsValidator,
} = require('../middlewares/validators/busTrip.validator');

const router = Router();

router.get('/all', getAllAvailableBusTripsValidator, validateRequest, getAllAvailableBusTrips);

router.get(
  '/available-dates',
  getAvailableDatesForRouteValidator,
  validateRequest,
  getAvailableDatesForRoute,
);

router.post('/create-scheduled', createBusTripValidator, validateRequest, createBusTrip);


router.get(
  '/available-buses',
  getAvailableBusesForRouteValidator,
  validateRequest,
  getAvailableBusesForDate,
);

router.get('/:busTripId/details', getBusTripDetailsValidator,validateRequest, getBusTripDetails);


router.get(
  '/one-scheduled-bus-trip-with-details/:id',
  busTripIdValidator,
  validateRequest,
  getBusTripById,
);
router.put('/update/:id', updateBusTripValidator, validateRequest, updateBusTrip);

router.delete('/delete/:id', updateBusTripValidator, validateRequest, deleteBusTrip);

const busTripRouter = router;
module.exports = { busTripRouter };
