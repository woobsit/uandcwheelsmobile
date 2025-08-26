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
const getAllAvailableBusTrips = async (req, res) => {
  try {
   const now = new Date();
    const scheduledBusTrips = await db.BusTrip.findAll({
      where: {
        status: 'scheduled',
        departure_time: { [Op.gte]: now },
      },
      include: [
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['fare'],
          include: [
            { model: db.Location, as: 'departureLocation', attributes: ['name', 'state'] },
            { model: db.Location, as: 'arrivalLocation', attributes: ['name', 'state'] },
          ],
        },
      ],
      order: [['departure_time', 'ASC']],
    });

    // Manually aggregate the data to match your frontend's UniqueTripRoute type
    const aggregatedTrips = scheduledBusTrips.reduce((acc, currentTrip) => {
      const departure = currentTrip.trip.departureLocation;
      const arrival = currentTrip.trip.arrivalLocation;
      const key = `${departure.name}-${departure.state}-${arrival.name}-${arrival.state}`;

      if (!acc[key]) {
        acc[key] = {
          departureLocationName: departure.name,
          departureLocationState: departure.state,
          arrivalLocationName: arrival.name,
          arrivalLocationState: arrival.state,
          minFare: currentTrip.trip.fare,
          maxFare: currentTrip.trip.fare,
          availableDates: new Set(),
        };
      } else {
        acc[key].minFare = Math.min(acc[key].minFare, currentTrip.trip.fare);
        acc[key].maxFare = Math.max(acc[key].maxFare, currentTrip.trip.fare);
      }
      acc[key].availableDates.add(currentTrip.departure_time.toISOString().split('T')[0]);
      return acc;
    }, {});

    const items = Object.values(aggregatedTrips).map(trip => ({
      ...trip,
      availableDatesCount: trip.availableDates.size,
      availableDates: undefined, // Remove the set to keep the response clean
    }));

    res.status(200).json({
      success: true,
      data: {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
        hasNext: false,
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
// A revised and more performant getScheduledBusTrips controller function
const getScheduledBusTrips = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const now = new Date();
    const { departureLocationName, arrivalLocationName, date } = req.query;

    const busTripWhereConditions = {
      status: 'scheduled',
      departure_time: { [Op.gte]: now },
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

    let result;
    let items;

    // Case 1: The 'date' query parameter is NOT provided.
// Case 1: The 'date' query parameter is NOT provided.
// Case 1: The 'date' query parameter is NOT provided.
if (!date) {
  // Use raw SQL query to get unique trip routes
  const query = `
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
    WHERE bt.status = 'scheduled' 
      AND bt.departure_time >= :now
      ${departureLocationName ? `AND dl.name LIKE :departureLocationName` : ''}
      ${arrivalLocationName ? `AND al.name LIKE :arrivalLocationName` : ''}
    GROUP BY
      dl.name,
      dl.state,
      al.name,
      al.state
    ORDER BY
      dl.name,
      al.name ASC
  `;

  const replacements = {
    now: now,
    ...(departureLocationName && { departureLocationName: `%${departureLocationName}%` }),
    ...(arrivalLocationName && { arrivalLocationName: `%${arrivalLocationName}%` }),
  };

  try {
    result = await db.sequelize.query(query, {
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    // The raw query directly returns the structured data, so no extra mapping is needed.
    items = result.map(item => ({
      departureLocationName: item.departureLocationName,
      departureLocationState: item.departureLocationState,
      arrivalLocationName: item.arrivalLocationName,
      arrivalLocationState: item.arrivalLocationState,
      minFare: parseFloat(item.minFare),
      maxFare: parseFloat(item.maxFare),
      availableDatesCount: parseInt(item.availableDatesCount),
    }));

    return res.status(200).json({
      success: true,
      data: {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
        hasNext: false,
      },
    });
  } catch (queryError) {
    logger.error('Raw query failed:', { error: queryError.message });
    throw queryError;
  }
} else {
      // Case 2: The 'date' query parameter IS provided.
      // This is for the TripDetailsScreen, so we return individual trips.
      const whereClause = {
        ...busTripWhereConditions,
        departure_time: {
          [Op.between]: [
            new Date(date),
            new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
          ],
        },
      };

      const { count, rows: scheduledBusTrips } = await db.BusTrip.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.Bus,
            as: 'bus',
            attributes: ['id', 'plate_number', 'brand', 'capacity', 'seat_arrangement'],
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
          {
            model: db.Booking,
            as: 'outboundBookings',
            required: false,
          },
        ],
        order: [['departure_time', 'ASC']],
        offset: (page - 1) * limit,
        limit,
        subQuery: false,
      });

      items = await Promise.all(
        scheduledBusTrips.map(async busTrip => {
          const busTripData = busTrip.get({ plain: true });

          const bookings = await db.Booking.findAll({
            where: {
              outbound_bus_trip_id: busTripData.id,
              status: { [Op.in]: ['confirmed', 'paid'] },
            },
            include: [
              {
                model: db.Passenger,
                as: 'passengers',
                attributes: ['seat_number'],
                where: { seat_number: { [Op.ne]: null } },
                required: false,
              },
            ],
          });

          const takenSeats = bookings
            .flatMap(booking => booking.passengers.map(p => p.seat_number))
            .filter(Boolean);

          const busCapacity = busTripData.bus?.capacity || 0;
          const actualAvailableSeats = Math.max(0, busCapacity - takenSeats.length);

          if (actualAvailableSeats <= 0) return null;

          return {
            id: busTripData.id,
            departure_time: busTripData.departure_time,
            estimated_arrival: busTripData.trip?.estimated_arrival,
            fare: parseFloat(busTripData.trip?.fare),
            status: busTripData.status,
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
              seat_arrangement: busTripData.bus?.seat_arrangement,
              taken_seats: takenSeats,
            },
            driver: {
              name: busTripData.driver?.name,
            },
            available_seats: actualAvailableSeats,
          };
        }),
      );
      items = items.filter(Boolean);

      return res.status(200).json({
        success: true,
        data: {
          items,
          total: count,
          page,
          limit,
          hasNext: items.length === limit,
        },
      });
    }
  } catch (error) {
    logger.error('Failed to fetch scheduled bus trips with availability:', {
      error: error.message,
      stack: error.stack, // Add stack trace for better debugging
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
  getAllAvailableBusTrips, // Renamed from getAllTrips, now fetches all BusTrips
  getScheduledBusTrips, // Renamed from getAllScheduledTrips
  getBusTripById, // Renamed from getTripById
  updateBusTrip, // Renamed from updateTrip
  deleteBusTrip, // Renamed from deleteTrip
  // searchTrips is redundant, getScheduledBusTrips handles it
  // getAvailableSeats is also covered by getBusTripById and getScheduledBusTrips
};
