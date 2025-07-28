const { body, param, query } = require('express-validator');
const db = require('../../models'); // Ensure this path is correct for your models
const moment = require('moment');

// --- Validator for createTripRoute (formerly createTrip) ---
// This validates the creation of a 'Trip' which is the route definition.
const createTripRouteValidator = [
  body('departure_location_id')
    .isInt({ min: 1 })
    .withMessage('Invalid departure location ID.')
    .custom(async value => {
      const location = await db.Location.findByPk(value);
      if (!location) {
        throw new Error('Departure location not found.');
      }
      return true;
    }),

  body('arrival_location_id')
    .isInt({ min: 1 })
    .withMessage('Invalid arrival location ID.')
    .custom(async (value, { req }) => {
      if (value === req.body.departure_location_id) {
        throw new Error('Arrival location must be different from departure location.');
      }
      const location = await db.Location.findByPk(value);
      if (!location) {
        throw new Error('Arrival location not found.');
      }
      return true;
    }),

  body('estimated_arrival')
    .isISO8601()
    .withMessage('Invalid estimated arrival time format (YYYY-MM-DDTHH:mm:ssZ).')
    .custom((value, { req }) => {
      // For a route, estimated_arrival doesn't directly depend on a specific departure_time
      // However, it should represent a valid future-ish time or at least after current date
      // This might be better as a time duration later, but for now, ensure it's a valid date.
      if (moment(value).isBefore(moment())) {
        // Check against current time for route definition
        throw new Error('Estimated arrival time for the route must be in the future.');
      }
      return true;
    }),

  body('fare').isFloat({ min: 0.01 }).withMessage('Fare must be a positive number.'),

  body('departure_terminal')
    .notEmpty()
    .withMessage('Departure terminal is required.')
    .isString()
    .withMessage('Departure terminal must be a string.')
    .isLength({ max: 255 })
    .withMessage('Departure terminal cannot exceed 255 characters.'),

  body('arrival_terminal')
    .notEmpty()
    .withMessage('Arrival terminal is required.')
    .isString()
    .withMessage('Arrival terminal must be a string.')
    .isLength({ max: 255 })
    .withMessage('Arrival terminal cannot exceed 255 characters.'),

  // Status for a Trip (route) typically defaults to 'scheduled' or 'active'
  body('status')
    .optional()
    .isIn(['scheduled', 'inactive']) // Adjust these based on your Trip model's ENUM
    .withMessage('Invalid trip route status. Valid values: scheduled, inactive.'),
];

module.exports = {
  createTripRouteValidator,
};
