// controllers/location.js
const db = require('../models');
const logger = require('../config/logger');

const createLocation = async (req, res) => {
  try {
    const { name, code, timezone } = req.body;

    const location = await db.Location.create({
      name,
      code,
      timezone,
    });

    return res.status(201).json({
      success: true,
      data: location,
    });
  } catch (error) {
    logger.error('Failed to create location', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAllLocations = async (req, res) => {
  try {
    const locations = await db.Location.findAll({
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    logger.error('Failed to fetch locations', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const location = await db.Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    await location.update(req.body);
    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    logger.error('Failed to update location', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getLocationById = async (req, res) => {
  try {
    const location = await db.Location.findByPk(req.params.id, {
      attributes: ['id', 'name', 'code', 'timezone', 'createdAt', 'updatedAt'],
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    logger.error('Failed to fetch location', {
      error: error instanceof Error ? error.message : 'Unknown error',
      locationId: req.params.id,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const location = await db.Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Check if location is used in any trips
    const tripsCount = await db.Trip.count({
      where: {
        [db.Sequelize.Op.or]: [
          { departure_location_id: location.id },
          { arrival_location_id: location.id },
        ],
      },
    });

    if (tripsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location used in trips',
      });
    }

    await location.destroy();
    return res.status(200).json({
      success: true,
      message: 'Location deleted',
    });
  } catch (error) {
    logger.error('Failed to delete location', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createLocation,
  getAllLocations,
  updateLocation,
  getLocationById,
  deleteLocation,
};
