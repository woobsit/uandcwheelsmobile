const { Router } = require('express');
const {
  createLocation,
  getAllLocations,
  updateLocation,
  getLocationById,
  deleteLocation
} = require('../controllers/location');
const {
  createLocationValidator,
  updateLocationValidator
} = require('../middlewares/validators/location.validator');
const { validateRequest } = require('../middlewares/validate-request');

const router = Router();

// Create a new location
router.post(
  '/create',
  createLocationValidator,
  validateRequest,
  createLocation
);

// Get all locations
router.get(
  '/all',
  getAllLocations
);

// Get single location by ID
router.get(
  '/show-one/:id',
  getLocationById
);

// Update location
router.put(
  '/update/:id',
  updateLocationValidator,
  validateRequest,
  updateLocation
);

// Delete location
router.delete(
  '/delete/:id',
  deleteLocation
);

const locationRouter = router;
module.exports = { locationRouter };