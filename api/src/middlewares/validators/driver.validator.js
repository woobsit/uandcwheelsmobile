// src/middlewares/validators/driver.validator.js
const { body } = require('express-validator');

const createDriverValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),

  body('license_number')
    .trim()
    .isLength({ min: 5 })
    .withMessage('License number must be at least 5 characters'),

  body('phone')
    .trim()
    .matches(/^(0)[0-9]{10}$/)
    .withMessage('Invalid phone number format'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

const updateDriverValidator = [
  body('phone')
    .optional()
    .trim()
    .matches(/^(0)[0-9]{10}$/)
    .withMessage('Invalid phone number format'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

module.exports = { createDriverValidator, updateDriverValidator };
