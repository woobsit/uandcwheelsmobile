const db = require('../models');
const logger = require('../config/logger');

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
      arrival_terminal, // Add these from your model
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

module.exports = {
  createTripRoute, // Renamed from createTrip
};
