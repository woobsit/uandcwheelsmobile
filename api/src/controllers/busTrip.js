const db = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// --- Controller Functions ---

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

const getAllAvailableBusTrips = async (req, res) => {
  try {
    // 1. Get and sanitize query parameters from the request
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Set a reasonable limit
    const offset = (page - 1) * limit;

    const searchTerm = req.query.searchTerm ? req.query.searchTerm.toLowerCase() : null;

    const now = new Date();

    // 2. Build the dynamic WHERE clause based on the search term
    let whereClause = `WHERE bt.status = 'scheduled' AND bt.departure_time >= :now`;
    if (searchTerm) {
      whereClause += `
        AND (
          LOWER(dl.name) LIKE :searchTerm OR LOWER(dl.state) LIKE :searchTerm
          OR LOWER(al.name) LIKE :searchTerm OR LOWER(al.state) LIKE :searchTerm
        )`;
    }

    // 3. Define the count and data queries
    const countQuery = `
      SELECT COUNT(DISTINCT CONCAT(dl.name, al.name)) AS totalRoutes
      FROM bus_trips bt
      INNER JOIN trips t ON bt.trip_id = t.id
      INNER JOIN locations dl ON t.departure_location_id = dl.id
      INNER JOIN locations al ON t.arrival_location_id = al.id
      ${whereClause};
    `;

    const dataQuery = `
      SELECT
        dl.name AS departureLocationName,
        dl.state AS departureLocationState,
        al.name AS arrivalLocationName,
        al.state AS arrivalLocationState,
        MIN(t.fare) AS minFare,
        MAX(t.fare) AS maxFare,
        COUNT(DISTINCT DATE(bt.departure_time)) AS availableDatesCount
      FROM bus_trips bt
      INNER JOIN trips t ON bt.trip_id = t.id
      INNER JOIN locations dl ON t.departure_location_id = dl.id
      INNER JOIN locations al ON t.arrival_location_id = al.id
      ${whereClause}
      GROUP BY dl.name, dl.state, al.name, al.state
      ORDER BY dl.name ASC, al.name ASC
      LIMIT :limit
      OFFSET :offset;
    `;

    // 4. Create the replacements object for the queries
    const replacements = {
      now,
      limit,
      offset,
    };
    if (searchTerm) {
      replacements.searchTerm = `%${searchTerm}%`; // Use a wildcard for `LIKE`
    }

    // 5. Execute both queries
    const [totalResults] = await db.sequelize.query(countQuery, {
      replacements, // Use the unified replacements object
      type: db.sequelize.QueryTypes.SELECT,
    });
    const total = totalResults.totalRoutes;
    
    const [paginatedResults] = await db.sequelize.query(dataQuery, {
      replacements, // Use the unified replacements object
      type: db.sequelize.QueryTypes.SELECT,
    });

    // 6. Calculate hasNext based on the fetched data and total count
    const hasNext = offset + paginatedResults.length < total;

    // 7. Send the paginated data as a response
    res.status(200).json({
      success: true,
      data: {
        items: paginatedResults,
        total: total,
        page,
        limit,
        hasNext,
      },
    });
  } catch (error) {
    logger.error('Error fetching all available trips:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available trips.',
    });
  }
};

// 4. Get All Scheduled Bus Trips (for Users/Booking)

// New file or new function in controllers/busTripController.js

const getAvailableDatesForRoute = async (req, res) => {
  try {
    const { 
      departureLocationName, 
      departureLocationState, 
      arrivalLocationName, 
      arrivalLocationState 
    } = req.query;

    if (!departureLocationName || !arrivalLocationName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: departureLocationName and arrivalLocationName.',
      });
    }

    const now = new Date();

    const query = `
      SELECT
        DATE(bt.departure_time) AS departureDate,
        MIN(t.fare) AS minFare,
        MAX(t.fare) AS maxFare,
        COUNT(bt.id) AS availableBusesCount
      FROM bus_trips bt
      INNER JOIN trips t ON bt.trip_id = t.id
      INNER JOIN locations dl ON t.departure_location_id = dl.id
      INNER JOIN locations al ON t.arrival_location_id = al.id
      WHERE bt.status = 'scheduled' 
      AND bt.departure_time >= :now
      AND dl.name = :departureLocationName
      AND dl.state = :departureLocationState
      AND al.name = :arrivalLocationName
      AND al.state = :arrivalLocationState
      GROUP BY departureDate
      ORDER BY departureDate ASC;
    `;

    const replacements = {
      now,
      departureLocationName,
      departureLocationState,
      arrivalLocationName,
      arrivalLocationState,
    };

    const [results] = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    // Process the raw results into the desired format
    const formattedResults = results.map(item => ({
      ...item,
      minFare: parseFloat(item.minFare),
      maxFare: parseFloat(item.maxFare),
      availableBusesCount: parseInt(item.availableBusesCount, 10),
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: formattedResults,
        total: formattedResults.length,
        hasNext: false,
        page: 1,
        limit: formattedResults.length,
      },
    });

  } catch (error) {
    logger.error('Failed to fetch available dates for route:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 5. Get Bus Trip by ID
// Revised getBusTripById controller function
const getBusTripById = async (req, res) => {
  try {
    const busTrip = await db.BusTrip.findByPk(req.params.id, {
      include: [
        {
          model: db.Bus,
          as: 'bus',
          attributes: ['id', 'plate_number', 'brand', 'capacity', 'seat_arrangement'],
        },
        {
          model: db.Driver,
          as: 'driver',
          attributes: ['id', 'name', 'license_number', 'phone'],
        },
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['id', 'estimated_arrival', 'fare', 'departure_terminal', 'arrival_terminal'],
          include: [
            { model: db.Location, as: 'departureLocation', attributes: ['id', 'name', 'state'] },
            { model: db.Location, as: 'arrivalLocation', attributes: ['id', 'name', 'state'] },
          ],
        },
        {
          model: db.Booking,
          as: 'outboundBookings',
          required: false,
          include: [
            {
              model: db.Passenger,
              as: 'passengers',
              required: false,
              where: { requires_seat: true, seat_number: { [Op.ne]: null } },
              attributes: ['seat_number'],
            },
          ],
        },
        {
          model: db.Booking,
          as: 'returnBookings',
          required: false,
          include: [
            {
              model: db.Passenger,
              as: 'passengers',
              required: false,
              where: { requires_seat: true, seat_number: { [Op.ne]: null } },
              attributes: ['seat_number'],
            },
          ],
        },
      ],
    });

    if (!busTrip) {
      return res.status(404).json({ success: false, message: 'Bus Trip not found' });
    }

    const busTripData = busTrip.get({ plain: true });

    const outboundSeats =
      busTripData.outboundBookings?.flatMap(booking =>
        booking.passengers.map(p => p.seat_number),
      ) || [];
    const returnSeats =
      busTripData.returnBookings?.flatMap(booking => booking.passengers.map(p => p.seat_number)) ||
      [];

    // Combine all seats and then filter out nulls and sort them
    const takenSeats = [...outboundSeats, ...returnSeats].filter(Boolean).sort((a, b) => {
      // Custom sort for seat numbers like "S1", "S10"
      const numA = parseInt(a.replace('S', ''), 10);
      const numB = parseInt(b.replace('S', ''), 10);
      return numA - numB;
    });

    const busCapacity = busTripData.bus.capacity || 0;
    const actualAvailableSeats = Math.max(0, busCapacity - takenSeats.length);

    const formattedBusTrip = {
      id: busTripData.id,
      departure_time: busTripData.departure_time,
      status: busTripData.status,
      estimated_arrival: busTripData.trip?.estimated_arrival,
      fare: parseFloat(busTripData.trip?.fare),
      departure_terminal: busTripData.trip?.departure_terminal,
      arrival_terminal: busTripData.trip?.arrival_terminal,
      departure_location: busTripData.trip?.departureLocation?.name || 'N/A',
      departure_state: busTripData.trip?.departureLocation?.state || '',
      arrival_location: busTripData.trip?.arrivalLocation?.name || 'N/A',
      arrival_state: busTripData.trip?.arrivalLocation?.state || '',
      bus: {
        plate_number: busTripData.bus?.plate_number,
        brand: busTripData.bus?.brand,
        capacity: busTripData.bus?.capacity,
        seat_arrangement: busTripData.bus?.seat_arrangement,
        taken_seats: takenSeats, // <-- This is now a sorted array
      },
      driver: {
        name: busTripData.driver?.name,
        license_number: busTripData.driver?.license_number,
      },
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
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel bus trip with existing bookings. Refunds must be handled.',
        });
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
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bus trip with existing bookings. Consider canceling instead.',
      });
    }

    await busTrip.destroy(); // Soft delete if paranoid is true in model
    return res.status(200).json({ success: true, message: 'Bus Trip deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete bus trip', { error: error.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createBusTrip, // New function for specific scheduled trips
  getAllAvailableBusTrips, // Renamed from getAllTrips, now fetches all BusTrips
  getAvailableDatesForRoute, 
  getBusTripById, // Renamed from getTripById
  updateBusTrip, // Renamed from updateTrip
  deleteBusTrip, // Renamed from deleteTrip
  
};
