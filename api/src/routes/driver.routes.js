// src/routes/driver.routes.js
const { Router } = require('express');
const {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
} = require('../controllers/driver');
const {
  createDriverValidator,
  updateDriverValidator,
} = require('../middlewares/validators/driver.validator');

const router = Router();

router.post('/', createDriverValidator, validateRequest, createDriver);
router.get('/', getAllDrivers);
router.get('/:id', getDriverById);
router.put('/:id', updateDriverValidator, validateRequest, updateDriver);
router.delete('/:id', deleteDriver);

const driverRouter = router;
module.exports = { driverRouter };
