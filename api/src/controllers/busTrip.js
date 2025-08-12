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
// A revised and more performant getScheduledBusTrips controller function
const getScheduledBusTrips = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const now = new Date();
    const { departureLocationName, arrivalLocationName, date } = req.query;

    const busTripWhereConditions = {
      status: 'scheduled',
      // Ensure we only show trips in the future, but handle date filtering correctly
      [Op.and]: [
        { departure_time: { [Op.gte]: now } },
        ...(date
          ? [
              {
                departure_time: {
                  [Op.between]: [
                    new Date(date),
                    new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
                  ],
                },
              },
            ]
          : []),
      ],
    };

    const tripWhereConditions = {};
    const departureLocationWhereConditions = {};
    const arrivalLocationWhereConditions = {};

    if (departureLocationName) {
      departureLocationWhereConditions.name = { [Op.like]: `%${departureLocationName}%` };
    }
    if (arrivalLocationName) {
      arrivalLocationWhereConditions.name = { [Op.like]: `%${arrivalLocationName}%` };
    }

    // A more reliable way to fetch the data is to include the bookings
    // and then aggregate the count in memory.
    const { count, rows: scheduledBusTrips } = await db.BusTrip.findAndCountAll({
      where: busTripWhereConditions,
      // No custom attributes here to avoid issues with COUNT query
      include: [
        {
          model: db.Bus,
          as: 'bus',
          attributes: ['id', 'plate_number', 'brand', 'capacity'],
        },
        {
          model: db.Driver,
          as: 'driver',
          attributes: ['id', 'name'],
        },
        {
          model: db.Trip,
          as: 'trip',
          where: Object.keys(tripWhereConditions).length > 0 ? tripWhereConditions : undefined,
          attributes: ['id', 'estimated_arrival', 'fare', 'departure_terminal', 'arrival_terminal'],
          include: [
            {
              model: db.Location,
              as: 'departureLocation',
              attributes: ['id', 'name', 'state'],
              where:
                Object.keys(departureLocationWhereConditions).length > 0
                  ? departureLocationWhereConditions
                  : undefined,
              required: Object.keys(departureLocationWhereConditions).length > 0,
            },
            {
              model: db.Location,
              as: 'arrivalLocation',
              attributes: ['id', 'name', 'state'],
              where:
                Object.keys(arrivalLocationWhereConditions).length > 0
                  ? arrivalLocationWhereConditions
                  : undefined,
              required: Object.keys(arrivalLocationWhereConditions).length > 0,
            },
          ],
        },
        // NEW: Include bookings here to calculate booked seats in JS
        {
          model: db.Booking,
          as: 'outboundBookings',
          attributes: ['id', 'adult_count', 'seated_child_count'],
          required: false,
        },
      ],
      order: [['departure_time', 'ASC']],
      offset: (page - 1) * limit,
      limit,
      subQuery: false, // Prevents Sequelize from wrapping the query in a subquery,
    });

    // Post-process the fetched rows to calculate available seats and filter
    const items = scheduledBusTrips
      .map(busTrip => {
        const busTripData = busTrip.get({ plain: true });

        // Calculate booked seats from the included bookings
        const bookedSeats = busTripData.outboundBookings
          ? busTripData.outboundBookings.reduce(
              (sum, booking) =>
                sum + (booking.adult_count || 0) + (booking.seated_child_count || 0),
              0,
            )
          : 0;

        const busCapacity = busTripData.bus?.capacity || 0;
        const actualAvailableSeats = Math.max(0, busCapacity - bookedSeats);

        // Do not return trips with zero available seats
        if (actualAvailableSeats <= 0) {
          return null;
        }

        return {
          id: busTripData.id,
          departure_time: busTripData.departure_time,
          // ✅ CORRECTED: Use optional chaining to safely access nested trip data
          estimated_arrival: busTripData.trip?.estimated_arrival,
          fare: parseFloat(busTripData.trip?.fare),
          status: busTripData.status,
          // ✅ CORRECTED: Use optional chaining to safely access nested location data
          departure_location: busTripData.trip?.departureLocation?.name,
          departure_state: busTripData.trip?.departureLocation?.state,
          departure_terminal: busTripData.trip?.departure_terminal,
          arrival_location: busTripData.trip?.arrivalLocation?.name,
          arrival_state: busTripData.trip?.arrivalLocation?.state,
          arrival_terminal: busTripData.trip?.arrival_terminal,
          bus: {
            plate_number: busTripData.bus?.plate_number,
            brand: busTripData.bus?.brand,
            capacity: busTripData.bus?.capacity,
          },
          driver: {
            name: busTripData.driver?.name,
          },
          available_seats: actualAvailableSeats,
        };
      })
      .filter(Boolean); // Remove null entries

    const totalAvailableTrips = items.length;

    // NOTE: The `count` from `findAndCountAll` now includes trips that might have 0 available seats.
    // The `total` returned in your response will only be the count of available trips on the current page.
    // This is a trade-off. To get a true total, you'd need another query or a more complex subquery with a HAVING clause.
    // For now, this is a reasonable approach.
    return res.status(200).json({
      success: true,
      data: {
        items,
        total: totalAvailableTrips,
        page,
        limit,
        hasNext: scheduledBusTrips.length === limit,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch scheduled bus trips with availability:', {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
  getAllBusTrips, // Renamed from getAllTrips, now fetches all BusTrips
  getScheduledBusTrips, // Renamed from getAllScheduledTrips
  getBusTripById, // Renamed from getTripById
  updateBusTrip, // Renamed from updateTrip
  deleteBusTrip, // Renamed from deleteTrip
  // searchTrips is redundant, getScheduledBusTrips handles it
  // getAvailableSeats is also covered by getBusTripById and getScheduledBusTrips
};
