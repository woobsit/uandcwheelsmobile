const { body, param } = require('express-validator');
const moment = require('moment');

const createTripValidator = [
  body('departure_location')
    .trim()
    .notEmpty()
    .withMessage('Departure location is required'),
  
  body('arrival_location')
    .trim()
    .notEmpty()
    .withMessage('Arrival location is required'),
  
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

module.exports = {
  createTripValidator,
  updateTripValidator
};