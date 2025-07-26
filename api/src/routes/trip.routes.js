// src/routes/trip.routes.js
const { Router } = require('express');
const {
  createTripRoute,
  createBusTrip,
  getAllBusTrips,
  getScheduledBusTrips,
  getBusTripById,
  updateBusTrip,
  deleteBusTrip,
  //searchTrips,
} = require('../controllers/trip');
const { validateRequest } = require('../middlewares/validate-request');
const {
  createTripValidator,
  updateTripValidator,
  //searchTripValidator,
  getAllTripValidator,
} = require('../middlewares/validators/trip.validator');

const router = Router();

// Public routes
//router.get('/search', searchTripValidator, validateRequest, searchTrips);

router.post('/create', createTripValidator, validateRequest, createTripRoute);
router.post('/create-scheduled', createTripValidator, validateRequest, createBusTrip);
router.get('/all', getAllTripValidator, validateRequest, getAllBusTrips);
router.get('/all-scheduled', getScheduledBusTrips);
router.get('/show-one/:id', getBusTripById);
router.put('/update/:id', updateTripValidator, validateRequest, updateBusTrip);
router.delete('/delete/:id', deleteBusTrip);

const tripRouter = router;
module.exports = { tripRouter };
