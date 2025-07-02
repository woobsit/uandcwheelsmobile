const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map(err => ({
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

module.exports = { validateRequest };
