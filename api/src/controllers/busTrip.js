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
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
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

    // 3. Define the count query to match the GROUP BY of the data query
    const countQuery = `
      SELECT COUNT(*) as totalRoutes
      FROM (
        SELECT 1
        FROM bus_trips bt
        INNER JOIN trips t ON bt.trip_id = t.id
        INNER JOIN locations dl ON t.departure_location_id = dl.id
        INNER JOIN locations al ON t.arrival_location_id = al.id
        ${whereClause}
        GROUP BY dl.name, dl.state, al.name, al.state
      ) as grouped_routes;
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
      replacements.searchTerm = `%${searchTerm}%`;
    }

    // 5. Execute both queries
    const [totalResults] = await db.sequelize.query(countQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    const total = totalResults?.totalRoutes || 0;
    
    const paginatedResults = await db.sequelize.query(dataQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    const formattedResults = paginatedResults.map(item => ({
      ...item,
      minFare: parseFloat(item.minFare),
      maxFare: parseFloat(item.maxFare),
      availableDatesCount: parseInt(item.availableDatesCount, 10),
    }));

    // 6. Calculate hasNext based on the fetched data and total count
    const hasNext = offset + paginatedResults.length < total;

    // 7. Send the paginated data as a response
    res.status(200).json({
      success: true,
      data: {
        items: formattedResults,
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

const getAvailableDatesForRoute = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      departureLocationName, 
      //departureLocationState, 
      arrivalLocationName, 
      //arrivalLocationState 
    } = req.query;

  /* if (!departureLocationName || !departureLocationState || !arrivalLocationName || !arrivalLocationState) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: departureLocationName, departureLocationState, arrivalLocationName, and arrivalLocationState.',
      });
    }*/

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT 1
        FROM bus_trips bt
        INNER JOIN trips t ON bt.trip_id = t.id
        INNER JOIN locations dl ON t.departure_location_id = dl.id
        INNER JOIN locations al ON t.arrival_location_id = al.id
        WHERE bt.status = 'scheduled' 
        AND bt.departure_time >= :now
        AND LOWER(dl.name) = LOWER(:departureLocationName)
        
        AND LOWER(al.name) = LOWER(:arrivalLocationName)
        
        GROUP BY DATE(bt.departure_time)
      ) AS count_table;
    `;

    const dataQuery = `
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
      AND LOWER(dl.name) = LOWER(:departureLocationName)
      
      AND LOWER(al.name) = LOWER(:arrivalLocationName)
      
      GROUP BY departureDate
      ORDER BY departureDate ASC
      LIMIT :limit
      OFFSET :offset;
    `;

    const replacements = {
      now,
      departureLocationName,
     // departureLocationState,
      arrivalLocationName,
     // arrivalLocationState,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
    
    const [totalResult] = await db.sequelize.query(countQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    const total = totalResult[0]?.total || 0;

    const results = await db.sequelize.query(dataQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    const formattedResults = results.map(item => ({
      ...item,
      minFare: parseFloat(item.minFare),
      maxFare: parseFloat(item.maxFare),
      availableBusesCount: parseInt(item.availableBusesCount, 10),
    }));   
    
    const hasNext = offset + formattedResults.length < total;

    return res.status(200).json({
      success: true,
      data: {
        items: formattedResults,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext,
      },
    });

  } catch (error) {
    logger.error('Failed to fetch available dates for route:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// 5. Get Bus Trip by ID
// Revised getBusTripById controller function
const getAvailableBusesForDate = async (req, res) => {
  try {
    // 1. Get and sanitize query parameters from the request
    const {
      page = 1,
      limit = 10,
      departureLocationName,
      departureLocationState,
      arrivalLocationName,
      arrivalLocationState,
      departureDate,
    } = req.query;

    // 2. Validate required parameters
  /*  if (
      !departureLocationName ||
      !departureLocationState ||
      !arrivalLocationName ||
      !arrivalLocationState ||
      !departureDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required parameters: departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState, and departureDate.',
      });
    }*/

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 3. Define the base WHERE clause with case-insensitive checks
    let whereClause = `
      WHERE bt.status = 'scheduled' 
      AND DATE(bt.departure_time) = :departureDate
      AND LOWER(dl.name) = LOWER(:departureLocationName)
      
      AND LOWER(al.name) = LOWER(:arrivalLocationName)
      
    `;

    // 4. Define the count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM bus_trips bt
      INNER JOIN trips t ON bt.trip_id = t.id
      INNER JOIN locations dl ON t.departure_location_id = dl.id
      INNER JOIN locations al ON t.arrival_location_id = al.id
      ${whereClause};
    `;

    // 5. Define the data query
    const dataQuery = `
      SELECT
        bt.id,
        bt.available_seats,
        bt.departure_time,
        t.fare,
        t.estimated_arrival,
        t.departure_terminal,
        t.arrival_terminal,
        b.plate_number,
        b.brand,
        b.capacity
      FROM bus_trips bt
      INNER JOIN trips t ON bt.trip_id = t.id
      INNER JOIN locations dl ON t.departure_location_id = dl.id
      INNER JOIN locations al ON t.arrival_location_id = al.id
      INNER JOIN buses b ON bt.bus_id = b.id
      ${whereClause}
      ORDER BY bt.departure_time ASC
      LIMIT :limit
      OFFSET :offset;
    `;

    // 6. Create the replacements object for both queries
    const replacements = {
      departureDate,
      departureLocationName,
      //departureLocationState,
      arrivalLocationName,
      //arrivalLocationState,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
    // 7. Execute both queries
    const [totalResult] = await db.sequelize.query(countQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    const total = totalResult[0]?.total || 0;

    const [results] = await db.sequelize.query(dataQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    // 8. Format the results
    const formattedResults = [results].map(item => ({
      id: item.id,
      available_seats: parseInt(item.available_seats, 10),
      departure_time: item.departure_time,
      fare: parseFloat(item.fare),
      estimated_arrival: item.estimated_arrival,
      departure_terminal: item.departure_terminal,
      arrival_terminal: item.arrival_terminal,
      bus_details: {
        plate_number: item.plate_number,
        brand: item.brand,
        capacity: item.capacity,
      },
    }));

    // 9. Calculate hasNext
    const hasNext = offset + formattedResults.length < total;

    // 10. Send the response
    return res.status(200).json({
      success: true,
      data: {
        items: formattedResults,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch available buses for date:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
  getAvailableBusesForDate, 
  getBusTripById, // Renamed from getTripById
  updateBusTrip, // Renamed from updateTrip
  deleteBusTrip, // Renamed from deleteTrip
  
};
