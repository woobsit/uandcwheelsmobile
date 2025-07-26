const db = require('../models');

// --- Helper Functions (Optional but good for reusability) ---

// Function to fetch and validate location, bus, and driver
const validateTripEntities = async (
  departure_location_id,
  arrival_location_id,
  bus_id,
  driver_id,
) => {
  const departureLocation = await db.Location.findByPk(departure_location_id);
  const arrivalLocation = await db.Location.findByPk(arrival_location_id);
  const bus = await db.Bus.findByPk(bus_id);
  const driver = await db.Driver.findByPk(driver_id);

  if (!departureLocation) return { message: 'Departure location not found', status: 404 };
  if (!arrivalLocation) return { message: 'Arrival location not found', status: 404 };
  if (!bus) return { message: 'Bus not found', status: 404 };
  if (!driver) return { message: 'Driver not found', status: 404 };

  return { success: true, departureLocation, arrivalLocation, bus, driver };
};

module.exports = { validateTripEntities };
