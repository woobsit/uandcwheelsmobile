// src/routes/bus.routes.js
const { Router } = require('express');
const { createBus, getAllBuses, getBusById, updateBus, deleteBus } = require('../controllers/bus');
const {
  createBusValidator,
  updateBusValidator,
} = require('../middlewares/validators/bus.validator');
const { validateRequest } = require('../middlewares/validate-request');

const router = Router();

router.post('/create', createBusValidator, validateRequest, createBus);
router.get('/all', getAllBuses);
router.get('/show-one/:id', getBusById);
router.put('/update/:id', updateBusValidator, validateRequest, updateBus);
router.delete('/delete/:id', deleteBus);

const busRouter = router;
module.exports = { busRouter };
