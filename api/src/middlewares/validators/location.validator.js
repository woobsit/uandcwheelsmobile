const { body } = require('express-validator');

const createLocationValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Location name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),
    
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Code must be exactly 3 characters')
    .isUppercase()
    .withMessage('Code must be uppercase')
    .matches(/^[A-Z]+$/)
    .withMessage('Code must contain only letters'),
    
  body('timezone')
    .optional()
    .isIn([
      'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 
      'Africa/Algiers', 'Africa/Asmara', 'Africa/Bamako', 
      'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 
      'Africa/Blantyre', 'Africa/Brazzaville', 'Africa/Bujumbura', 
      'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta', 
      'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 
      'Africa/Djibouti', 'Africa/Douala', 'Africa/El_Aaiun', 
      'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 
      'Africa/Johannesburg', 'Africa/Juba', 'Africa/Kampala', 
      'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa', 
      'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 
      'Africa/Luanda', 'Africa/Lubumbashi', 'Africa/Lusaka', 
      'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 
      'Africa/Mbabane', 'Africa/Mogadishu', 'Africa/Monrovia', 
      'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey', 
      'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 
      'Africa/Sao_Tome', 'Africa/Tripoli', 'Africa/Tunis', 
      'Africa/Windhoek', 'America/Adak', 'America/Anchorage', 
      'America/Anguilla', 'America/Antigua', 'America/Araguaina', 
      // ... include other valid timezones ...
      'Pacific/Wallis', 'Pacific/Yap'
    ])
    .withMessage('Invalid timezone')
];

const updateLocationValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),
    
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Code must be exactly 3 characters')
    .isUppercase()
    .withMessage('Code must be uppercase')
    .matches(/^[A-Z]+$/)
    .withMessage('Code must contain only letters'),
    
  body('timezone')
    .optional()
    .isIn([
      // Same timezone list as above
      'Africa/Abidjan', 
      // ... full list ...
      'Pacific/Yap'
    ])
    .withMessage('Invalid timezone')
];

module.exports = { createLocationValidator, updateLocationValidator };