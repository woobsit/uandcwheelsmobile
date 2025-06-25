// src/routes/bus.routes.js
const { Router } = require('express');
const {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
} = require('../controllers/bus.controller');
const {
  createBusValidator,
  updateBusValidator,
} = require('../middlewares/validators/bus.validator');

const router = Router();

router.post('/', createBusValidator, validateRequest, createBus);
router.get('/', getAllBuses);
router.get('/:id', getBusById);
router.put('/:id', updateBusValidator, validateRequest, updateBus);
router.delete('/:id', deleteBus);

const busRouter = router;
module.exports = { busRouter };
