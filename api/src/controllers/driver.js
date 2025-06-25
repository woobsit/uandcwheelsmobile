// src/controllers/driver.controller.js
const db = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const createDriver = async (req, res) => {
  try {
    const driver = await db.Driver.create(req.body);
    return res.status(201).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    logger.error('Failed to create driver', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) where.is_active = status === 'active';

    const drivers = await db.Driver.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    logger.error('Failed to fetch all drivers', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getDriverById = async (req, res) => {
  try {
    const driver = await db.Driver.findByPk(req.params.id, {
      include: [
        {
          model: db.Trip,
          as: 'trips',
          attributes: ['id', 'departure_location', 'arrival_location', 'departure_time'],
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    return res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    logger.error('Failed to fetch driver', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateDriver = async (req, res) => {
  try {
    const [updated] = await db.Driver.update(req.body, {
      where: { id: req.params.id },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const updatedDriver = await db.Driver.findByPk(req.params.id);
    return res.json({
      success: true,
      data: updatedDriver,
    });
  } catch (error) {
    logger.error('Failed to update driver', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const deleted = await db.Driver.destroy({
      where: { id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    return res.json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete driver', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { createDriver, getAllDrivers, getDriverById, updateDriver, deleteDriver };
