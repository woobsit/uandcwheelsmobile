import { body } from 'express-validator';

export const registerValidators = [
  // Name validation
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),

  // Email validation
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),

  // Password validation
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 20 }).withMessage('Password must be between 8-20 characters'),
   

  // Optional fields (if you're accepting these in registration)
  body('email_verified_at').optional().isISO8601().toDate(),
  body('remember_token').optional().isString()
];

export const loginValidators = [
 
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),

  // Password validation
  body('password')
    .notEmpty().withMessage('Password is required'),  
];