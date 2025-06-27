const { body, param, query } = require('express-validator');
const moment = require('moment');

const createTripValidator = [
// For createTripValidator
body('departure_location_id')
  .isInt({ min: 1 })
  .withMessage('Invalid departure location'),

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
    .custom((value) => {
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
  
  body('fare')
    .isFloat({ min: 0.01 })
    .withMessage('Fare must be a positive number'),
  
  body('bus_id')
    .isInt({ min: 1 })
    .withMessage('Invalid bus ID'),
  
  body('driver_id')
    .isInt({ min: 1 })
    .withMessage('Invalid driver ID'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'canceled'])
    .withMessage('Invalid trip status')
];

const updateTripValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid trip ID'),
  
  body('departure_time')
    .optional()
    .isISO8601()
    .withMessage('Invalid departure time format'),
  
  body('estimated_arrival')
    .optional()
    .isISO8601()
    .withMessage('Invalid estimated arrival time format'),
  
  body('fare')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Fare must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'canceled'])
    .withMessage('Invalid trip status')
];

 const searchTripsValidations = [
  query('from').notEmpty().isString(),
  query('to').notEmpty().isString(),
  query('date').isISO8601().toDate()
];

module.exports = {
  createTripValidator,
  updateTripValidator,
  searchTripsValidations
};