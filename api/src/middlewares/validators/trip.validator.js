const { body, param, query } = require('express-validator');
const db = require('../../models'); // Ensure this path is correct for your models
const moment = require('moment');

// --- Validator for createTripRoute (formerly createTrip) ---
// This validates the creation of a 'Trip' which is the route definition.
const createTripRouteValidator = [
  body('departure_location_id')
    .isInt({ min: 1 }).withMessage('Invalid departure location ID.')
    .custom(async value => {
      const location = await db.Location.findByPk(value);
      if (!location) {
        throw new Error('Departure location not found.');
      }
      return true;
    }),

  body('arrival_location_id')
    .isInt({ min: 1 }).withMessage('Invalid arrival location ID.')
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
      if (moment(value).isBefore(moment())) { // Check against current time for route definition
        throw new Error('Estimated arrival time for the route must be in the future.');
      }
      return true;
    }),

  body('fare')
    .isFloat({ min: 0.01 })
    .withMessage('Fare must be a positive number.'),

  body('departure_terminal')
    .notEmpty().withMessage('Departure terminal is required.')
    .isString().withMessage('Departure terminal must be a string.')
    .isLength({ max: 255 }).withMessage('Departure terminal cannot exceed 255 characters.'),

  body('arrival_terminal')
    .notEmpty().withMessage('Arrival terminal is required.')
    .isString().withMessage('Arrival terminal must be a string.')
    .isLength({ max: 255 }).withMessage('Arrival terminal cannot exceed 255 characters.'),

  // Status for a Trip (route) typically defaults to 'scheduled' or 'active'
  body('status')
    .optional()
    .isIn(['scheduled', 'inactive']) // Adjust these based on your Trip model's ENUM
    .withMessage('Invalid trip route status. Valid values: scheduled, inactive.'),
];

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
  createTripRouteValidator,
  createBusTripValidator,
  updateBusTripValidator,
  busTripIdValidator, // For getBusTripById and deleteBusTrip
  getAllBusTripsValidator,
  getScheduledBusTripsValidator,
};