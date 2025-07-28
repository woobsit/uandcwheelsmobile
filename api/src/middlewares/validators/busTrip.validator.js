const { body, param, query } = require('express-validator');
const db = require('../../models'); // Ensure this path is correct for your models
const moment = require('moment');

// --- Validator for createBusTrip ---
// This validates the creation of an actual scheduled 'BusTrip'
const createBusTripValidator = [
  body('trip_id')
    .isInt({ min: 1 }).withMessage('Invalid trip route ID.')
    .custom(async value => {
      const tripRoute = await db.Trip.findByPk(value);
      if (!tripRoute) {
        throw new Error('Associated trip route not found.');
      }
      return true;
    }),

  body('bus_id')
    .isInt({ min: 1 }).withMessage('Invalid bus ID.')
    .custom(async value => {
      const bus = await db.Bus.findByPk(value);
      if (!bus) {
        throw new Error('Bus not found.');
      }
      return true;
    }),

  body('driver_id')
    .isInt({ min: 1 }).withMessage('Invalid driver ID.')
    .custom(async value => {
      const driver = await db.Driver.findByPk(value);
      if (!driver) {
        throw new Error('Driver not found.');
      }
      return true;
    }),

  body('departure_time')
    .isISO8601()
    .withMessage('Invalid departure time format (YYYY-MM-DDTHH:mm:ssZ).')
    .custom(value => {
      if (moment(value).isBefore(moment().add(5, 'minutes'))) { // Give a small buffer for immediate scheduling
        throw new Error('Departure time must be at least 5 minutes in the future.');
      }
      return true;
    }),

  // available_seats can be optional if you default to bus capacity
  body('available_seats')
    .optional()
    .isInt({ min: 0 }).withMessage('Available seats must be a non-negative integer.'),

  // Status for a BusTrip can be set on creation, but defaults to 'scheduled'
  body('status')
    .optional()
    .isIn(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'])
    .withMessage('Invalid bus trip status. Valid values: scheduled, boarding, departed, arrived, cancelled.'),
];

// --- Validator for updateBusTrip ---
// This validates updates to a specific 'BusTrip'
const updateBusTripValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid bus trip ID.'),

  // All fields are optional for updates
  body('bus_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid bus ID.')
    .custom(async value => {
      const bus = await db.Bus.findByPk(value);
      if (!bus) {
        throw new Error('Bus not found.');
      }
      return true;
    }),

  body('driver_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid driver ID.')
    .custom(async value => {
      const driver = await db.Driver.findByPk(value);
      if (!driver) {
        throw new Error('Driver not found.');
      }
      return true;
    }),

  body('departure_time')
    .optional()
    .isISO8601()
    .withMessage('Invalid departure time format (YYYY-MM-DDTHH:mm:ssZ).'), // No future check here as it might be updating past trips

  body('available_seats')
    .optional()
    .isInt({ min: 0 }).withMessage('Available seats must be a non-negative integer.'),

  body('status')
    .optional()
    .isIn(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'])
    .withMessage('Invalid bus trip status. Valid values: scheduled, boarding, departed, arrived, cancelled.'),

  // If you allow updating the associated trip_id, include validation here
  body('trip_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid trip route ID.')
    .custom(async value => {
      const tripRoute = await db.Trip.findByPk(value);
      if (!tripRoute) {
        throw new Error('Associated trip route not found.');
      }
      return true;
    }),
];

// --- Validator for deleteBusTrip and getBusTripById ---
// Both only need to validate the ID parameter.
const busTripIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid bus trip ID.'),
];

// --- Validator for getAllBusTrips (Admin View) ---
const getAllBusTripsValidator = [
  // Status filtering for BusTrip (scheduled, boarding, departed, arrived, cancelled)
  query('status')
    .optional()
    .isIn(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'])
    .withMessage('Invalid bus trip status. Valid values: scheduled, boarding, departed, arrived, cancelled.'),

  // Location-based filtering, these refer to the 'name' of the location (e.g., "Lagos")
  query('from')
    .optional()
    .trim()
    .notEmpty().withMessage('Departure location name cannot be empty.'),

  query('to')
    .optional()
    .trim()
    .notEmpty().withMessage('Arrival location name cannot be empty.'),

  // Date filtering (for departure_time of BusTrip)
  query('date')
    .optional()
    .isISO8601({ strict: true }).withMessage('Invalid date format. Use ISO format (YYYY-MM-DD).')
    .toDate(), // Convert to Date object

  // Pagination parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
];

// --- Validator for getScheduledBusTrips (User/Booking View) ---
const getScheduledBusTripsValidator = [
  // No status query needed as it's hardcoded to 'scheduled' and future dates
  // You might want to allow filtering by status for other purposes, but not for "bookable" trips

  // New query parameters for location name and state
  query('departureLocationName')
    .optional()
    .trim()
    .notEmpty().withMessage('Departure location name cannot be empty.'),
  query('departureLocationState')
    .optional()
    .trim()
    .notEmpty().withMessage('Departure location state cannot be empty.'),
  query('arrivalLocationName')
    .optional()
    .trim()
    .notEmpty().withMessage('Arrival location name cannot be empty.'),
  query('arrivalLocationState')
    .optional()
    .trim()
    .notEmpty().withMessage('Arrival location state cannot be empty.'),

  // Date filtering for 'departure_time'
  query('date')
    .optional()
    .isISO8601({ strict: true }).withMessage('Invalid date format. Use ISO format (YYYY-MM-DD).')
    .toDate(), // Convert to Date object

  // Pagination parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.').toInt(), // Limiting max for public API
];

module.exports = {
  createBusTripValidator,
  updateBusTripValidator,
  busTripIdValidator, // For getBusTripById and deleteBusTrip
  getAllBusTripsValidator,
  getScheduledBusTripsValidator,
};