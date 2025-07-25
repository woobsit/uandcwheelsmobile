const db = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize'); // Import Op for Sequelize operators

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
    const { status, from, to, date, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

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

    // Get total count for pagination
    const total = await db.Trip.count({ where });

    // Get paginated trips
    const trips = await db.Trip.findAll({
      where,
      include: [
        { model: db.Bus, attributes: ['plate_number', 'brand', 'capacity'] },
        { model: db.Driver, attributes: ['name', 'license_number'] },
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
      order: [['departure_time', 'ASC']],
      offset,
      limit: limitNumber,
    });

    // Format response with location names
    const items = trips.map(trip => {
      const tripData = trip.get({ plain: true });
      return {
        ...tripData,
        departure_location: tripData.departureLocation.name,
        arrival_location: tripData.arrivalLocation.name,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: pageNumber,
        limit: limitNumber,
        hasNext: offset + limitNumber < total,
      },
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

const getAllScheduledTrips = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const now = new Date();

    // 1. Fetch ALL scheduled BusTrips that are in the future,
    //    and include all necessary associated data.
    //    We need to fetch them all first to accurately filter by available_seats.
    const scheduledBusTrips = await db.BusTrip.findAll({
      where: {
        status: 'scheduled',
        departure_time: { [Op.gte]: now }, // BusTrip has departure_time
      },
      include: [
        {
          model: db.Bus,
          as: 'bus', // Alias from BusTrip.belongsTo(models.Bus, { as: 'bus' })
          attributes: ['id', 'plate_number', 'brand', 'capacity'],
        },
        {
          model: db.Driver,
          as: 'driver', // Alias from BusTrip.belongsTo(models.Driver, { as: 'driver' })
          attributes: ['id', 'name', 'license_number'],
        },
        {
          model: db.Trip,
          as: 'trip', // Alias from BusTrip.belongsTo(models.Trip, { as: 'trip' })
          attributes: [
            'id',
            'estimated_arrival', // From Trip
            'fare', // From Trip
            'departure_terminal', // From Trip
            'arrival_terminal', // From Trip
          ],
          include: [
            {
              model: db.Location,
              as: 'departureLocation', // Alias from Trip.belongsTo(models.Location, { as: 'departureLocation' })
              attributes: ['id', 'name', 'state'], // Removed terminal as it's on Trip
            },
            {
              model: db.Location,
              as: 'arrivalLocation', // Alias from Trip.belongsTo(models.Location, { as: 'arrivalLocation' })
              attributes: ['id', 'name', 'state'], // Removed terminal as it's on Trip
            },
          ],
        },
      ],
      order: [['departure_time', 'ASC']],
      // NO offset or limit here yet, as we need to filter by availability first
    });

    const tripsWithAvailability = [];

    // 2. Iterate through fetched BusTrips to calculate (or verify) available seats
    //    and filter out those with no seats.
    for (const busTrip of scheduledBusTrips) {
      const busTripData = busTrip.get({ plain: true });

      // Ensure bus, driver, and trip data exists
      if (!busTripData.bus || !busTripData.driver || !busTripData.trip) {
        console.warn(`Skipping BusTrip ${busTripData.id} due to missing associated data.`);
        continue;
      }

      // We have available_seats directly on BusTrip.
      // However, we need to recalculate or verify it based on actual bookings,
      // as `available_seats` on the model might not be real-time if not updated on booking.
      // It's safer to always calculate from confirmed/pending/paid bookings.

      const adultBooked = await db.Booking.sum('adult_count', {
        where: {
          outbound_bus_trip_id: busTripData.id,
          status: {
            [Op.in]: ['confirmed', 'pending', 'paid'],
          },
        },
      });

      const lapChildBooked = await db.Booking.sum('lap_child_count', {
        where: {
          outbound_bus_trip_id: busTripData.id,
          status: {
            [Op.in]: ['confirmed', 'pending', 'paid'],
          },
        },
      });

      const seatedChildBooked = await db.Booking.sum('seated_child_count', {
        where: {
          outbound_bus_trip_id: busTripData.id,
          status: {
            [Op.in]: ['confirmed', 'pending', 'paid'],
          },
        },
      });

      // Sum the results in JavaScript, handling nulls (if no bookings)
      const bookedSeats = (adultBooked || 0) + (lapChildBooked || 0) + (seatedChildBooked || 0);

      console.log(bookedSeats);

      const busCapacity = busTripData.bus.capacity || 0;
      const actualAvailableSeats = Math.max(0, busCapacity - (bookedSeats || 0));

      // Only include the BusTrip if there are available seats.
      // We will use the calculated actualAvailableSeats for filtering and display.
      if (actualAvailableSeats > 0) {
        tripsWithAvailability.push({
          id: busTripData.id, // This is the BusTrip ID, which is what the frontend needs to book
          departure_time: busTripData.departure_time,
          estimated_arrival: busTripData.trip.estimated_arrival, // From Trip
          fare: parseFloat(busTripData.trip.fare), // From Trip, ensure it's a number
          status: busTripData.status, // Status of the BusTrip itself

          // Location details (from Trip -> Location)
          departure_location: busTripData.trip.departureLocation?.name || 'Unknown',
          departure_state: busTripData.trip.departureLocation?.state || '',
          departure_terminal: busTripData.trip.departure_terminal || '', // From Trip
          arrival_location: busTripData.trip.arrivalLocation?.name || 'Unknown',
          arrival_state: busTripData.trip.arrivalLocation?.state || '',
          arrival_terminal: busTripData.trip.arrival_terminal || '', // From Trip

          // Bus details (from BusTrip -> Bus)
          Bus: {
            // Keep PascalCase 'Bus' to match frontend expectation
            plate_number: busTripData.bus?.plate_number || 'N/A',
            brand: busTripData.bus?.brand || 'Unknown',
            capacity: busTripData.bus?.capacity || 0,
          },
          // Driver details (from BusTrip -> Driver)
          Driver: {
            // Keep PascalCase 'Driver' to match frontend expectation
            name: busTripData.driver?.name || 'Driver not assigned',
            license_number: busTripData.driver?.license_number || 'N/A',
          },
          available_seats: actualAvailableSeats, // The truly available seats
        });
      }
    }

    // 3. Implement Precise Pagination on the filtered results (tripsWithAvailability)
    const totalAvailableTrips = tripsWithAvailability.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = tripsWithAvailability.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: {
        items: paginatedItems,
        total: totalAvailableTrips,
        page,
        limit,
        hasNext: endIndex < totalAvailableTrips, // True if there are more items beyond the current page
      },
    });
  } catch (error) {
    console.error('Failed to fetch scheduled bus trips with availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack,
      }),
    });
  }
};

const getAvailableSeats = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get trip with bus information
    const trip = await db.Trip.findByPk(tripId, {
      include: [
        {
          model: db.Bus,
          attributes: ['capacity'],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Get total booked seats for this trip
    const totalBooked = await db.Booking.sum('numberOfSeats', {
      where: { tripId },
    });

    const availableSeats = trip.Bus.capacity - (totalBooked || 0);

    return res.status(200).json({
      success: true,
      data: {
        availableSeats: Math.max(availableSeats, 0),
        capacity: trip.Bus.capacity,
      },
    });
  } catch (error) {
    logger.error('Failed to get available seats', {
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
          attributes: ['name'],
        },
        {
          model: db.Location,
          as: 'arrivalLocation',
          attributes: ['name'],
        },
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
          attributes: ['name'],
        },
        {
          model: db.Location,
          as: 'arrivalLocation',
          attributes: ['name'],
        },
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
  getAllScheduledTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  searchTrips,
  getAvailableSeats,
};
