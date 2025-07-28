// src/routes/trip.routes.js
const { Router } = require('express');
const { createTripRoute } = require('../controllers/trip');
const { validateRequest } = require('../middlewares/validate-request');
const { createTripRouteValidator } = require('../middlewares/validators/trip.validator');

const router = Router();

// Public routes

router.post('/create', createTripRouteValidator, validateRequest, createTripRoute);

const tripRouter = router;
module.exports = { tripRouter };
