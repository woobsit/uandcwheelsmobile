// src/middlewares/validators/bus.validator.js
const { body } = require('express-validator');

const createBusValidator = [
  body('plate_number')
    .trim()
    .isLength({ min: 5, max: 15 })
    .withMessage('Plate number must be 5-15 characters'),

  body('brand').trim().notEmpty().withMessage('Brand is required'),

  body('model').trim().notEmpty().withMessage('Model is required'),

  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),

  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'retired'])
    .withMessage('Invalid status'),
];

const updateBusValidator = [
  body('plate_number')
    .optional()
    .trim()
    .isLength({ min: 5, max: 15 })
    .withMessage('Plate number must be 5-15 characters'),

  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),

  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'retired'])
    .withMessage('Invalid status'),
];

module.exports = { createBusValidator, updateBusValidator };
