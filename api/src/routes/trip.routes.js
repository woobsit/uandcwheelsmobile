// src/routes/trip.routes.js
const { Router } = require('express');
const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/trip');
const { validateRequest } = require('../middlewares/validate-request');
const {
  createTripValidator,
  updateTripValidator,
} = require('../middlewares/validators/trip.validator');

const router = Router();

router.post('/create', createTripValidator, validateRequest, createTrip);
router.get('/all', getAllTrips);
router.get('/show-one/:id', getTripById);
router.put('/update/:id', updateTripValidator, validateRequest, updateTrip);
router.delete('/delete/:id', deleteTrip);

const tripRouter = router;
module.exports = { tripRouter };
