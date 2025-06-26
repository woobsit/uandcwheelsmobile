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
const { validateRequest } = require('../middlewares/validate-request');

const router = Router();

router.post('/create', createDriverValidator, validateRequest, createDriver);
router.get('/all', getAllDrivers);
router.get('/show-one/:id', getDriverById);
router.put('/update/:id', updateDriverValidator, validateRequest, updateDriver);
router.delete('/delete/:id', deleteDriver);

const driverRouter = router;
module.exports = { driverRouter };
