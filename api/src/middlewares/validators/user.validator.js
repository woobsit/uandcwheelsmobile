const { body } = require('express-validator');

const updateProfileValidations = [
  body('phone')
    .isString()
    .withMessage('Phone must be a number')
    .isLength({ min: 11, max: 11 })
    .withMessage('Phone must be 11 characters'),

  body('address')
    .isString()
    .withMessage('Address must be a string')
    .isLength({ max: 255 })
    .withMessage('Address too long'),

  body('birth_date').isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD'),

  body('preferred_payment_method')
    .optional()
    .isString()
    .withMessage('Payment method must be a string')
    .isIn(['credit_card', 'paypal', 'bank_transfer', 'cash'])
    .withMessage('Invalid payment method'),
];

module.exports = { updateProfileValidations };
