const db = require('../models');
const logger = require('../config/logger');

const createTrip = async (req, res) => {
  try {
    const {
      departure_location,
      arrival_location,
      departure_time,
      estimated_arrival,
      fare,
      bus_id,
      driver_id,
    } = req.body;

    // Check if bus exists
    const bus = await db.Bus.findByPk(bus_id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    // Check if driver exists
    const driver = await db.Driver.findByPk(driver_id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const trip = await db.Trip.create({
      departure_location,
      arrival_location,
      departure_time: new Date(departure_time),
      estimated_arrival: new Date(estimated_arrival),
      fare,
      bus_id,
      driver_id,
      status: 'scheduled',
    });

    return res.status(201).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    logger.error('Failed to create trip', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAllTrips = async (req, res) => {
  try {
    const { status, from, to, date } = req.query;
    const where = {};

    if (status) where.status = status;
    if (from) where.departure_location = from;
    if (to) where.arrival_location = to;

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      where.departure_time = {
        [db.Sequelize.Op.between]: [startDate, endDate],
      };
    }

    const trips = await db.Trip.findAll({
      where,
      include: [
        { model: db.Bus, attributes: ['plate_number', 'brand', 'capacity'] },
        { model: db.Driver, attributes: ['name', 'license_number'] },
      ],
      order: [['departure_time', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: trips,
    });
  } catch (error) {
    logger.error('Failed to fetch trips', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await db.Trip.findByPk(req.params.id, {
      include: [
        { model: db.Bus, attributes: ['id', 'plate_number', 'brand', 'capacity'] },
        { model: db.Driver, attributes: ['id', 'name', 'license_number', 'phone'] },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    logger.error('Failed to fetch trip', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateTrip = async (req, res) => {
  try {
    const trip = await db.Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Prevent updating trips that have bookings
    if (req.body.status === 'canceled') {
      const bookings = await db.Booking.count({ where: { trip_id: trip.id } });
      if (bookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel trip with existing bookings',
        });
      }
    }

    await trip.update(req.body);
    return res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    logger.error('Failed to update trip', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const trip = await db.Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check for existing bookings
    const bookings = await db.Booking.count({ where: { trip_id: trip.id } });
    if (bookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete trip with existing bookings',
      });
    }

    await trip.destroy();
    return res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete trip', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
