const db = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// --- Controller Functions ---

// 1. Create a Trip (Route Definition - for admin)
// This function will now create a 'Trip' (the route template)
const createTripRoute = async (req, res) => {
  try {
    const {
      departure_location_id,
      arrival_location_id,
      estimated_arrival, // This is estimated for the route itself
      fare,
      departure_terminal, // Add these from your model
      arrival_terminal,   // Add these from your model
    } = req.body;

    // Validate locations
    const departureLocation = await db.Location.findByPk(departure_location_id);
    const arrivalLocation = await db.Location.findByPk(arrival_location_id);

    if (!departureLocation) {
      return res.status(404).json({ success: false, message: 'Departure location not found' });
    }
    if (!arrivalLocation) {
      return res.status(404).json({ success: false, message: 'Arrival location not found' });
    }

    const trip = await db.Trip.create({
      departure_location_id,
      arrival_location_id,
      estimated_arrival: new Date(estimated_arrival),
      fare,
      departure_terminal,
      arrival_terminal,
      status: 'scheduled', // A route can be 'scheduled', 'inactive', etc.
    });

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    logger.error('Failed to create trip route', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 2. Create a Bus Trip (Actual Scheduled Trip - for admin)
// This will be the primary "create a trip" for booking purposes
const createBusTrip = async (req, res) => {
  try {
    const {
      trip_id, // The ID of the Trip (route) this BusTrip belongs to
      bus_id,
      driver_id,
      departure_time,
      available_seats, // Initial available seats
    } = req.body;

    // Validate the associated Trip (route)
    const tripRoute = await db.Trip.findByPk(trip_id);
    if (!tripRoute) {
      return res.status(404).json({ success: false, message: 'Associated trip route not found' });
    }

    // Validate bus and driver
    const bus = await db.Bus.findByPk(bus_id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    const driver = await db.Driver.findByPk(driver_id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Create the BusTrip
    const busTrip = await db.BusTrip.create({
      trip_id,
      bus_id,
      driver_id,
      departure_time: new Date(departure_time),
      available_seats: available_seats || bus.capacity, // Default to bus capacity
      status: 'scheduled',
    });

    return res.status(201).json({ success: true, data: busTrip });
  } catch (error) {
    logger.error('Failed to create bus trip', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 3. Get All Bus Trips (for Admin - scheduled or not)
const getAllBusTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, from, to, date } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const busTripWhere = {};
    const tripWhere = {};
    const departureLocationWhere = {};
    const arrivalLocationWhere = {};

    if (status) busTripWhere.status = status;

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      busTripWhere.departure_time = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (from) {
      const location = await db.Location.findOne({ where: { name: from } });
      if (location) tripWhere.departure_location_id = location.id;
    }

    if (to) {
      const location = await db.Location.findOne({ where: { name: to } });
      if (location) tripWhere.arrival_location_id = location.id;
    }


    const { count, rows: busTrips } = await db.BusTrip.findAndCountAll({
      where: busTripWhere,
      include: [
        { model: db.Bus, as: 'bus', attributes: ['id', 'plate_number', 'brand', 'capacity'] },
        { model: db.Driver, as: 'driver', attributes: ['id', 'name', 'license_number', 'phone'] },
        {
          model: db.Trip,
          as: 'trip',
          where: Object.keys(tripWhere).length > 0 ? tripWhere : undefined, // Apply trip route filters
          attributes: [
            'id',
            'estimated_arrival',
            'fare',
            'departure_terminal',
            'arrival_terminal',
            'departure_location_id',
            'arrival_location_id',
          ],
          include: [
            { model: db.Location, as: 'departureLocation', attributes: ['id', 'name', 'state'] },
            { model: db.Location, as: 'arrivalLocation', attributes: ['id', 'name', 'state'] },
          ],
        },
      ],
      order: [['departure_time', 'ASC']],
      offset,
      limit: limitNumber,
    });

    const items = busTrips.map(busTrip => {
      const busTripData = busTrip.get({ plain: true });
      return {
        ...busTripData,
        departure_location: busTripData.trip?.departureLocation?.name || 'N/A',
        arrival_location: busTripData.trip?.arrivalLocation?.name || 'N/A',
        // Flatten nested properties for easier frontend consumption
        estimated_arrival: busTripData.trip?.estimated_arrival,
        fare: busTripData.trip?.fare,
        departure_terminal: busTripData.trip?.departure_terminal,
        arrival_terminal: busTripData.trip?.arrival_terminal,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
        total: count,
        page: pageNumber,
        limit: limitNumber,
        hasNext: offset + limitNumber < count,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch all bus trips', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4. Get All Scheduled Bus Trips (for Users/Booking)
// This is your current getAllScheduledTrips, renamed for clarity.
const getScheduledBusTrips = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const now = new Date();

    const {
      departureLocationName,
      departureLocationState,
      arrivalLocationName,
      arrivalLocationState,
      date, // New: filter by specific date
    } = req.query;

    const busTripWhereConditions = {
      status: 'scheduled',
      departure_time: { [Op.gte]: now }, // Only future scheduled trips
    };

    const tripWhereConditions = {};
    const departureLocationWhereConditions = {};
    const arrivalLocationWhereConditions = {};

    // Apply date filter if provided
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate());
      const endOfDay = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate() + 1);

      busTripWhereConditions.departure_time = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    if (departureLocationName) {
      departureLocationWhereConditions.name = { [Op.like]: `%${departureLocationName}%` };
    }
    if (departureLocationState) {
      departureLocationWhereConditions.state = { [Op.like]: `%${departureLocationState}%` };
    }
    if (arrivalLocationName) {
      arrivalLocationWhereConditions.name = { [Op.like]: `%${arrivalLocationName}%` };
    }
    if (arrivalLocationState) {
      arrivalLocationWhereConditions.state = { [Op.like]: `%${arrivalLocationState}%` };
    }

    const { count, rows: scheduledBusTrips } = await db.BusTrip.findAndCountAll({
      where: busTripWhereConditions,
      include: [
        {
          model: db.Bus,
          as: 'bus',
          attributes: ['id', 'plate_number', 'brand', 'capacity'],
        },
        {
          model: db.Driver,
          as: 'driver',
          attributes: ['id', 'name', 'license_number'],
        },
        {
          model: db.Trip,
          as: 'trip',
          where: Object.keys(tripWhereConditions).length > 0 ? tripWhereConditions : undefined,
          attributes: [
            'id',
            'estimated_arrival',
            'fare',
            'departure_terminal',
            'arrival_terminal',
          ],
          include: [
            {
              model: db.Location,
              as: 'departureLocation',
              attributes: ['id', 'name', 'state'],
              where: Object.keys(departureLocationWhereConditions).length > 0 ? departureLocationWhereConditions : undefined,
              required: Object.keys(departureLocationWhereConditions).length > 0, // Inner join if filtering
            },
            {
              model: db.Location,
              as: 'arrivalLocation',
              attributes: ['id', 'name', 'state'],
              where: Object.keys(arrivalLocationWhereConditions).length > 0 ? arrivalLocationWhereConditions : undefined,
              required: Object.keys(arrivalLocationWhereConditions).length > 0, // Inner join if filtering
            },
          ],
        },
      ],
      order: [['departure_time', 'ASC']],
      offset: (page - 1) * limit,
      limit,
    });

    const tripsWithAvailability = [];

    for (const busTrip of scheduledBusTrips) {
      const busTripData = busTrip.get({ plain: true });

      if (!busTripData.bus || !busTripData.driver || !busTripData.trip || !busTripData.trip.departureLocation || !busTripData.trip.arrivalLocation) {
        logger.warn(`Skipping BusTrip ${busTripData.id} due to missing associated data.`);
        continue;
      }

      const adultBooked = await db.Booking.sum('adult_count', {
        where: { outbound_bus_trip_id: busTripData.id, status: { [Op.in]: ['confirmed', 'pending', 'paid'] } },
      });
      const lapChildBooked = await db.Booking.sum('lap_child_count', {
        where: { outbound_bus_trip_id: busTripData.id, status: { [Op.in]: ['confirmed', 'pending', 'paid'] } },
      });
      const seatedChildBooked = await db.Booking.sum('seated_child_count', {
        where: { outbound_bus_trip_id: busTripData.id, status: { [Op.in]: ['confirmed', 'pending', 'paid'] } },
      });

      const bookedSeats = (adultBooked || 0) + (lapChildBooked || 0) + (seatedChildBooked || 0);
      const busCapacity = busTripData.bus.capacity || 0;
      const actualAvailableSeats = Math.max(0, busCapacity - bookedSeats);

      if (actualAvailableSeats > 0) {
        tripsWithAvailability.push({
          id: busTripData.id,
          departure_time: busTripData.departure_time,
          estimated_arrival: busTripData.trip.estimated_arrival,
          fare: parseFloat(busTripData.trip.fare),
          status: busTripData.status,

          departure_location: busTripData.trip.departureLocation.name,
          departure_state: busTripData.trip.departureLocation.state,
          departure_terminal: busTripData.trip.departure_terminal,
          arrival_location: busTripData.trip.arrivalLocation.name,
          arrival_state: busTripData.trip.arrivalLocation.state,
          arrival_terminal: busTripData.trip.arrival_terminal,

          bus: {
            plate_number: busTripData.bus.plate_number,
            brand: busTripData.bus.brand,
            capacity: busTripData.bus.capacity,
          },
          driver: {
            name: busTripData.driver.name,
            license_number: busTripData.driver.license_number,
          },
          available_seats: actualAvailableSeats,
        });
      }
    }

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
        hasNext: endIndex < totalAvailableTrips,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch scheduled bus trips with availability:', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 5. Get Bus Trip by ID
const getBusTripById = async (req, res) => {
  try {
    const busTrip = await db.BusTrip.findByPk(req.params.id, {
      include: [
        { model: db.Bus, as: 'bus', attributes: ['id', 'plate_number', 'brand', 'capacity'] },
        { model: db.Driver, as: 'driver', attributes: ['id', 'name', 'license_number', 'phone'] },
        {
          model: db.Trip,
          as: 'trip',
          attributes: [
            'id',
            'estimated_arrival',
            'fare',
            'departure_terminal',
            'arrival_terminal',
          ],
          include: [
            { model: db.Location, as: 'departureLocation', attributes: ['id', 'name', 'state'] },
            { model: db.Location, as: 'arrivalLocation', attributes: ['id', 'name', 'state'] },
          ],
        },
      ],
    });

    if (!busTrip) {
      return res.status(404).json({ success: false, message: 'Bus Trip not found' });
    }

    const busTripData = busTrip.get({ plain: true });
    // Calculate available seats
    const adultBooked = await db.Booking.sum('adult_count', { where: { outbound_bus_trip_id: busTripData.id, status: { [Op.in]: ['confirmed', 'pending', 'paid'] } } });
    const lapChildBooked = await db.Booking.sum('lap_child_count', { where: { outbound_bus_trip_id: busTripData.id, status: { [Op.in]: ['confirmed', 'pending', 'paid'] } } });
    const seatedChildBooked = await db.Booking.sum('seated_child_count', { where: { outbound_bus_trip_id: busTripData.id, status: { [Op.in]: ['confirmed', 'pending', 'paid'] } } });
    const bookedSeats = (adultBooked || 0) + (lapChildBooked || 0) + (seatedChildBooked || 0);
    const busCapacity = busTripData.bus.capacity || 0;
    const actualAvailableSeats = Math.max(0, busCapacity - bookedSeats);

    const formattedBusTrip = {
      ...busTripData,
      departure_location: busTripData.trip?.departureLocation?.name || 'N/A',
      arrival_location: busTripData.trip?.arrivalLocation?.name || 'N/A',
      departure_state: busTripData.trip?.departureLocation?.state || '',
      arrival_state: busTripData.trip?.arrivalLocation?.state || '',
      estimated_arrival: busTripData.trip?.estimated_arrival,
      fare: busTripData.trip?.fare,
      departure_terminal: busTripData.trip?.departure_terminal,
      arrival_terminal: busTripData.trip?.arrival_terminal,
      available_seats: actualAvailableSeats,
    };

    return res.status(200).json({ success: true, data: formattedBusTrip });
  } catch (error) {
    logger.error('Failed to fetch bus trip by ID', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// 6. Update Bus Trip (for Admin)
const updateBusTrip = async (req, res) => {
  try {
    const busTrip = await db.BusTrip.findByPk(req.params.id);
    if (!busTrip) {
      return res.status(404).json({ success: false, message: 'Bus Trip not found' });
    }

    // Prevent direct status changes if bookings exist, especially to 'cancelled'
    if (req.body.status === 'cancelled') {
      const bookingsCount = await db.Booking.count({
        where: {
          outbound_bus_trip_id: busTrip.id,
          status: { [Op.in]: ['confirmed', 'pending', 'paid'] },
        },
      });
      if (bookingsCount > 0) {
        return res.status(400).json({ success: false, message: 'Cannot cancel bus trip with existing bookings. Refunds must be handled.' });
      }
    }

    await busTrip.update(req.body);
    return res.status(200).json({ success: true, data: busTrip });
  } catch (error) {
    logger.error('Failed to update bus trip', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 7. Delete Bus Trip (for Admin)
const deleteBusTrip = async (req, res) => {
  try {
    const busTrip = await db.BusTrip.findByPk(req.params.id);
    if (!busTrip) {
      return res.status(404).json({ success: false, message: 'Bus Trip not found' });
    }

    const bookingsCount = await db.Booking.count({
      where: {
        outbound_bus_trip_id: busTrip.id,
        status: { [Op.in]: ['confirmed', 'pending', 'paid'] },
      },
    });

    if (bookingsCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete bus trip with existing bookings. Consider canceling instead.' });
    }

    await busTrip.destroy(); // Soft delete if paranoid is true in model
    return res.status(200).json({ success: true, message: 'Bus Trip deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete bus trip', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  createTripRoute, // Renamed from createTrip
  createBusTrip,   // New function for specific scheduled trips
  getAllBusTrips,  // Renamed from getAllTrips, now fetches all BusTrips
  getScheduledBusTrips, // Renamed from getAllScheduledTrips
  getBusTripById, // Renamed from getTripById
  updateBusTrip, // Renamed from updateTrip
  deleteBusTrip, // Renamed from deleteTrip
  // searchTrips is redundant, getScheduledBusTrips handles it
  // getAvailableSeats is also covered by getBusTripById and getScheduledBusTrips
};