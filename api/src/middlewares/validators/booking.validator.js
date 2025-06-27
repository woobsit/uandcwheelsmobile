 const { body } =require( 'express-validator');

 const createBookingValidations = [
  body('trip_id').isInt().toInt(),
  body('seats').isArray({ min: 1 }),
  body('seats.*').isInt({ min: 1, max: 50 }),
  body('payment_method').isIn(['credit_card', 'mobile_money', 'bank_transfer'])
];

module.exports = {createBookingValidations}