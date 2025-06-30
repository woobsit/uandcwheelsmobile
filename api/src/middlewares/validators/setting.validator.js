const { body } = require('express-validator');
const db = require('../../models');

const settingValidator = [
  body().custom(async (values, { req }) => {
    const validSettings = await db.Setting.findAll({ attributes: ['name'] });
    const settingNames = validSettings.map(s => s.name);
    
    for (const key of Object.keys(values)) {
      if (!settingNames.includes(key)) {
        throw new Error(`Invalid setting: ${key}`);
      }
    }
    return true;
  }),
  body('contact_email').if(body('contact_email').exists()).isEmail(),
  body('max_seats_per_booking').if(body('max_seats_per_booking').exists()).isInt({ min: 1 }),
  body('is_booking_active').if(body('is_booking_active').exists()).isBoolean(),
  // Add more specific validations as needed
];

module.exports = { settingValidator };