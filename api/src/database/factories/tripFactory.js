// src/factories/tripFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createTrip: (busId, driverId, departureLocId, arrivalLocId, overrides = {}) => {
    const departure = new Date();
    departure.setDate(departure.getDate() + faker.number.int({ min: 1, max: 30 }));

    const arrival = new Date(departure);
    arrival.setHours(arrival.getHours() + faker.number.int({ min: 2, max: 12 }));
    return {
      bus_id: busId,
      driver_id: driverId,
      departure_location_id: departureLocId, // was departure_location
      arrival_location_id: arrivalLocId, // was arrival_location
      departure_time: departure,
      estimated_arrival: arrival,
      fare: faker.number.float({ min: 1500, max: 15000, precision: 2 }),
      status: 'scheduled',
      ...overrides,
    };
  },
};
