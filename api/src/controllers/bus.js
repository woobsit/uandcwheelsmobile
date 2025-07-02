// src/controllers/bus.controller.js
const db = require('../models');
const logger = require('../config/logger');

const createBus = async (req, res) => {
  try {
    const bus = await db.Bus.create(req.body);
    return res.status(201).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    logger.error('Failed to create bus', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAllBuses = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) where.status = status;

    const buses = await db.Bus.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: buses,
    });
  } catch (error) {
    logger.error('Failed to fetch buses', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getBusById = async (req, res) => {
  try {
    const bus = await db.Bus.findByPk(req.params.id, {
      include: [
        {
          model: db.Trip,
          as: 'trips',
          attributes: ['id', 'departure_time'],
          include: [
            {
              model: db.Location,
              as: 'departureLocation',
              attributes: ['name'],
            },
            {
              model: db.Location,
              as: 'arrivalLocation',
              attributes: ['name'],
            },
          ],
        },
      ],
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    // Format trips with location names
    const busData = bus.get({ plain: true });
    busData.trips = busData.trips.map(trip => ({
      ...trip,
      departure_location: trip.departureLocation.name,
      arrival_location: trip.arrivalLocation.name,
    }));

    return res.status(200).json({
      success: true,
      data: busData,
    });
  } catch (error) {
    logger.error('Failed to fetch bus', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateBus = async (req, res) => {
  try {
    const [updated] = await db.Bus.update(req.body, {
      where: { id: req.params.id },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    const updatedBus = await db.Bus.findByPk(req.params.id);
    return res.json({
      success: true,
      data: updatedBus,
    });
  } catch (error) {
    logger.error('Failed to fetch buses', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteBus = async (req, res) => {
  try {
    const deleted = await db.Bus.destroy({
      where: { id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    return res.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete buses', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, deleteBus };
