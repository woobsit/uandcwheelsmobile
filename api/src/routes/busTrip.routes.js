// src/routes/trip.routes.js
const { Router } = require('express');
const {
  createBusTrip,
  getAllAvailableBusTrips,
  getScheduledBusTrips,
  getBusTripById,
  updateBusTrip,
  deleteBusTrip,
  //searchTrips,
} = require('../controllers/busTrip');
const { validateRequest } = require('../middlewares/validate-request');
const {
  createBusTripValidator,
  updateBusTripValidator,
  busTripIdValidator,
  //getAllAvailableBusTripsValidator,
  getScheduledBusTripsValidator,
} = require('../middlewares/validators/busTrip.validator');

const router = Router();

router.post('/create-scheduled', createBusTripValidator, validateRequest, createBusTrip);
router.get('/all', getAllAvailableBusTrips);
router.get(
  '/one-scheduled-bus-trip-with-details/:id',
  busTripIdValidator,
  validateRequest,
  getBusTripById,
);
router.put('/update/:id', updateBusTripValidator, validateRequest, updateBusTrip);
router.get(
  '/scheduled-bus-trips',
  getScheduledBusTripsValidator,
  validateRequest,
  getScheduledBusTrips,
);
router.delete('/delete/:id', updateBusTripValidator, validateRequest, deleteBusTrip);

const busTripRouter = router;
module.exports = { busTripRouter };
