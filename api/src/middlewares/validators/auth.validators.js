const { body } = require('express-validator');

const registerValidators = [
  // Name validation
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),

  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 255 })
    .withMessage('Password must be between 6-255 characters'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm Password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const verifyEmailValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers'),
];

const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  // Password validation
  body('password').notEmpty().withMessage('Password is required'),

  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
    .toBoolean(), // Convert string 'true'/'false' to boolean
];

// src/middlewares/input-validators.ts
const forgotPasswordValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
];

// const verifyResetCodeValidators = [
//     body('email')
//     .trim()
//     .notEmpty()
//     .withMessage('Email is required')
//     .isEmail()
//     .withMessage('Email must be valid')
//     .normalizeEmail(),

//     body('code')
//     .trim()
//     .notEmpty().withMessage('Password reset code is required')
//     .isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
//     .isNumeric().withMessage('Code must contain only numbers')
// ];

const resetPasswordValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 8 characters'),
];

const resendVerificationValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
];

module.exports = {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  //verifyResetCodeValidators,
  resetPasswordValidators,
  verifyEmailValidators,
  resendVerificationValidators,
};
