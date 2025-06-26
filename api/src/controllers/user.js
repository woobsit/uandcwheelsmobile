const db = require( '../models/index');
const logger = require( '../config/logger');

  const getCurrentUser = async (req, res) => {
    try {
      // req.user is set by passport.js authentication middleware
      const user = await db.User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'resetToken'] },
      });

      if (!user) {
       return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

    return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Failed to fetch user profile', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update user profile
   */
  const updateProfile = async (req, res) => {
    try {
      const { phone, address, birth_date, preferred_payment_method } = req.body;

      const user = await db.User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
        
      }

      // Only update allowed fields
      const updatedFields = {
        phone: phone || user.phone,
        address: address || user.address,
        birth_date: birth_date || user.birth_date,
        preferred_payment_method: preferred_payment_method || user.preferred_payment_method,
      };

      await user.update(updatedFields);

     return res.json({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          address: user.address,
          birth_date: user.birth_date,
          preferred_payment_method: user.preferred_payment_method,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch user profile', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

     return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  module.exports = {getCurrentUser, updateProfile}