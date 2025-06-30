const { Router } = require('express');
const {
  getSettings,
  updateSettings
} = require('../controllers/setting');
const {
  settingValidator  // Changed to match the validator export name
} = require('../middlewares/validators/setting.validator');
const { validateRequest } = require('../middlewares/validate-request');
//const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// GET settings (public)
router.get('/', getSettings);

// UPDATE settings (admin only)
router.put(
  '/update',
  //authenticate,
  //authorize('admin'),
  ...settingValidator,  // Spread the array of validators
  validateRequest,
  updateSettings
);

const settingRouter = router;
module.exports = { settingRouter };