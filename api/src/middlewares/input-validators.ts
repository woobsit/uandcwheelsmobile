import { body, query } from 'express-validator';

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
    .isLength({ min: 6, max: 20 }).withMessage('Password must be between 6-20 characters'),
   
    body('confirmPassword')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
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

     body('rememberMe')
    .optional()
    .isBoolean().withMessage('Remember me must be a boolean')
    .toBoolean() // Convert string 'true'/'false' to boolean
];

// src/middlewares/input-validators.ts
export const forgotPasswordValidators = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail()
];

export const verifyEmailValidators = [
  query('token') 
    .notEmpty().withMessage('Verification token is required')
    .isString().withMessage('Verification token must be a string') // Add type check
];
export const resetPasswordValidators = [
  body('token')
    .notEmpty().withMessage('Token is required'),
    
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 20 }).withMessage('Password must be between 6-20 characters'),
    
  body('confirmPassword')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

export const updateProfileValidations = [
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .isLength({ min: 11, max: 11 })
    .withMessage('Phone must be between 10-15 characters'),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
    .isLength({ max: 255 })
    .withMessage('Address too long'),
    
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
    
  body('preferred_payment_method')
    .optional()
    .isString()
    .withMessage('Payment method must be a string')
    .isIn(['credit_card', 'paypal', 'bank_transfer', 'cash'])
    .withMessage('Invalid payment method'),
];