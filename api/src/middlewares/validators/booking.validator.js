const { body } = require('express-validator');

const createBookingValidations = [
  // Validate Trip IDs
  body('outbound_bus_trip_id').isInt().toInt().withMessage('Outbound trip ID must be a valid integer.'),
  body('return_bus_trip_id').optional({ checkFalsy: true }).isInt().toInt().withMessage('Return trip ID must be a valid integer.'),

  // Validate Passenger Counts
  body('adult_count').isInt({ min: 1 }).toInt().withMessage('Adult count must be a positive integer.'),
  body('lap_child_count').isInt({ min: 0 }).toInt().withMessage('Lap child count must be a non-negative integer.'),
  body('seated_child_count').isInt({ min: 0 }).toInt().withMessage('Seated child count must be a non-negative integer.'),

  // Validate Total Amount
  body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number.'),
  
  // Validate Payment Method
  body('payment_method').isIn(['cash', 'bank_transfer', 'credit_card']).withMessage('Invalid payment method.'),

  // Validate Guest Details
  body('is_guest').isBoolean().withMessage('is_guest must be a boolean.'),
  body('guest_email')
    .if(body('is_guest').equals(true))
    .isEmail().withMessage('Valid guest email is required for guest bookings.'),
  
  // Validate Emergency Contact
  body('emergency_contact_name').notEmpty().withMessage('Emergency contact name is required.'),
  body('emergency_contact_phone').notEmpty().withMessage('Emergency contact phone is required.'),

  // Validate Passengers Array
  body('passengers').isArray({ min: 1 }).withMessage('Passengers must be a non-empty array.'),
  
  // Validate each passenger object
  body('passengers.*.name').notEmpty().withMessage('Passenger name is required.'),
  body('passengers.*.age').isInt({ min: 0 }).withMessage('Passenger age must be a non-negative integer.'),
  body('passengers.*.type').isIn(['adult', 'lap-child', 'seated-child']).withMessage('Invalid passenger type.'),
  body('passengers.*.requires_seat').isBoolean().withMessage('requires_seat must be a boolean.'),
  body('passengers.*.is_on_lap').isBoolean().withMessage('is_on_lap must be a boolean.'),
  body('passengers.*.is_primary').isBoolean().withMessage('is_primary must be a boolean.'),
  
  // Validate seat number for passengers requiring a seat
  body('passengers.*.seat_number')
    .if(body('passengers.*.requires_seat').equals(true))
    .notEmpty().withMessage('Seat number is required for seated passengers.'),
];

module.exports = { createBookingValidations };