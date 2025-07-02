const db = require('../models');
const logger = require('../config/logger');

const getSettings = async (req, res) => {
  try {
    const settings = await db.Setting.getAllSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Failed to get settings', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = await db.Setting.updateSettings(req.body);
    return res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Failed to update settings', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
