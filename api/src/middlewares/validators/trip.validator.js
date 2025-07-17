const { body, param, query } = require('express-validator');
const db = require('../../models');
const moment = require('moment');

const createTripValidator = [
  // For createTripValidator
  body('departure_location_id').isInt({ min: 1 }).withMessage('Invalid departure location'),

  body('arrival_location_id')
    .isInt({ min: 1 })
    .withMessage('Invalid arrival location')
    .custom((value, { req }) => {
      if (value === req.body.departure_location_id) {
        throw new Error('Arrival location must be different from departure');
      }
      return true;
    }),

  body('departure_time')
    .isISO8601()
    .withMessage('Invalid departure time format')
    .custom(value => {
      if (moment(value).isBefore(moment())) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),

  body('estimated_arrival')
    .isISO8601()
    .withMessage('Invalid estimated arrival time format')
    .custom((value, { req }) => {
      if (moment(value).isBefore(moment(req.body.departure_time))) {
        throw new Error('Estimated arrival must be after departure time');
      }
      return true;
    }),

  body('fare').isFloat({ min: 0.01 }).withMessage('Fare must be a positive number'),

  body('bus_id').isInt({ min: 1 }).withMessage('Invalid bus ID'),

  body('driver_id').isInt({ min: 1 }).withMessage('Invalid driver ID'),

  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'canceled'])
    .withMessage('Invalid trip status'),
];

const updateTripValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid trip ID'),

  body('departure_time').optional().isISO8601().withMessage('Invalid departure time format'),

  body('estimated_arrival')
    .optional()
    .isISO8601()
    .withMessage('Invalid estimated arrival time format'),

  body('fare').optional().isFloat({ min: 0.01 }).withMessage('Fare must be a positive number'),

  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'canceled'])
    .withMessage('Invalid trip status'),
];

const searchTripValidator = [
  query('from').notEmpty().isString(),
  query('to').notEmpty().isString(),
  query('date').isISO8601().toDate(),
];

const getAllTripValidator = [
  // Validate 'status' parameter - optional
  query('status')
    .optional()
    .isIn(['scheduled', 'departed', 'arrived', 'cancelled'])
    .withMessage('Invalid trip status. Valid values: scheduled, departed, arrived, cancelled'),

  // Validate 'from' parameter - optional
  query('from')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Departure location cannot be empty')
    .bail() // Stop validation chain if previous check failed
    .custom(async (value, { req }) => {
      try {
        const location = await db.Location.findOne({ where: { name: value } });
        if (!location) throw new Error(`Departure location '${value}' not found`);

        // Store location for later use in controller
        req.validatedLocations = req.validatedLocations || {};
        req.validatedLocations.from = location;
        return true;
      } catch (error) {
        throw new Error('Error validating departure location');
      }
    }),

  // Validate 'to' parameter - optional
  query('to')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Arrival location cannot be empty')
    .bail() // Stop validation chain if previous check failed
    .custom(async (value, { req }) => {
      try {
        const location = await db.Location.findOne({ where: { name: value } });
        if (!location) throw new Error(`Arrival location '${value}' not found`);

        // Store location for later use in controller
        req.validatedLocations = req.validatedLocations || {};
        req.validatedLocations.to = location;
        return true;
      } catch (error) {
        throw new Error('Error validating arrival location');
      }
    }),

  // Validate 'date' parameter - optional
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO format (YYYY-MM-DD)')
    .bail() // Stop validation chain if previous check failed
    .custom(value => {
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error('Invalid date value');
        return true;
      } catch (error) {
        throw new Error('Error validating date');
      }
    }),

  // Validate pagination parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];


module.exports = {
  createTripValidator,
  updateTripValidator,
  searchTripValidator,
  getAllTripValidator,
};
