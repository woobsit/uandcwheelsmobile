const db = require('../models');
const logger = require('../config/logger');

const createTrip = async (req, res) => {
  try {
    const {
      departure_location_id,
      arrival_location_id,
      departure_time,
      estimated_arrival,
      fare,
      bus_id,
      driver_id,
    } = req.body;

   // Check if locations exist
    const departureLocation = await db.Location.findByPk(departure_location_id);
    const arrivalLocation = await db.Location.findByPk(arrival_location_id);
    
    if (!departureLocation) {
      return res.status(404).json({
        success: false,
        message: 'Departure location not found',
      });
    }
    
    if (!arrivalLocation) {
      return res.status(404).json({
        success: false,
        message: 'Arrival location not found',
      });
    }


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
      departure_location_id,
      arrival_location_id,
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
     // Location-based filtering
    if (from) {
      const location = await db.Location.findOne({ where: { name: from } });
      if (location) where.departure_location_id = location.id;
    }
    
    if (to) {
      const location = await db.Location.findOne({ where: { name: to } });
      if (location) where.arrival_location_id = location.id;
    }

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
         { 
          model: db.Location, 
          as: 'departureLocation',
          attributes: ['name'] 
        },
        { 
          model: db.Location, 
          as: 'arrivalLocation',
          attributes: ['name'] 
        }
      ],
      order: [['departure_time', 'ASC']],
    });

        // Format response with location names
    const formattedTrips = trips.map(trip => {
      const tripData = trip.get({ plain: true });
      return {
        ...tripData,
        departure_location: tripData.departureLocation.name,
        arrival_location: tripData.arrivalLocation.name,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedTrips,
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
         { 
          model: db.Location, 
          as: 'departureLocation',
          attributes: ['name'] 
        },
        { 
          model: db.Location, 
          as: 'arrivalLocation',
          attributes: ['name'] 
        }
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

     // Format response with location names
    const tripData = trip.get({ plain: true });
    const formattedTrip = {
      ...tripData,
      departure_location: tripData.departureLocation.name,
      arrival_location: tripData.arrivalLocation.name,
    };

    return res.status(200).json({
      success: true,
      data: formattedTrip,
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

const searchTrips = async (req, res) => {
  try {
    const { from, to, date } = req.query;

// Find location IDs
    const departureLocation = await db.Location.findOne({ where: { name: from } });
    const arrivalLocation = await db.Location.findOne({ where: { name: to } });

        if (!departureLocation || !arrivalLocation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid departure or arrival location',
      });
    }

    const trips = await db.Trip.findAll({
      where: {
        departure_location_id: departureLocation.id,
        arrival_location_id: arrivalLocation.id,
        departure_time: {
          [db.Sequelize.Op.between]: [
            new Date(date),
            new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
          ],
        },
        status: 'scheduled',
      },
      include: [
        {
          model: db.Bus,
          attributes: ['plate_number', 'brand', 'capacity'],
        },
        {
          model: db.Location,
          as: 'departureLocation',
          attributes: ['name']
        },
        {
          model: db.Location,
          as: 'arrivalLocation',
          attributes: ['name']
        }
      ],
    });

     // Format response
    const formattedTrips = trips.map(trip => {
      const tripData = trip.get({ plain: true });
      return {
        ...tripData,
        departure_location: tripData.departureLocation.name,
        arrival_location: tripData.arrivalLocation.name,
      };
    });

    return res.status(200).json({ success: true, data: formattedTrips });
  } catch (error) {
    logger.error('Failed to get trip', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
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
  searchTrips
};
