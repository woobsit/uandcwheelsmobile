// src/routes/trip.routes.js
const { Router } = require('express');
const {
  createBusTrip,
  getAllAvailableBusTrips,
  getAvailableDatesForRoute,
  getBusTripById,
  updateBusTrip,
  deleteBusTrip,
} = require('../controllers/busTrip');
const { validateRequest } = require('../middlewares/validate-request');
const {
  createBusTripValidator,
  updateBusTripValidator,
  busTripIdValidator,
  getAllAvailableBusTripsValidator,
  getAvailableDatesForRouteValidator,
} = require('../middlewares/validators/busTrip.validator');

const router = Router();

router.post('/create-scheduled', createBusTripValidator, validateRequest, createBusTrip);
router.get('/all', getAllAvailableBusTripsValidator, validateRequest, getAllAvailableBusTrips);
router.get(
  '/one-scheduled-bus-trip-with-details/:id',
  busTripIdValidator,
  validateRequest,
  getBusTripById,
);
router.put('/update/:id', updateBusTripValidator, validateRequest, updateBusTrip);
router.get(
  '/available-dates',
  getAvailableDatesForRouteValidator,
  validateRequest,
  getAvailableDatesForRoute,
);
router.delete('/delete/:id', updateBusTripValidator, validateRequest, deleteBusTrip);

const busTripRouter = router;
module.exports = { busTripRouter };
