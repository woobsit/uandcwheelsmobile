// seeders/XXXXXXXXXXXXXX-demo-bookings.js (Final)
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    // Get all BusTrips and Users
    const busTrips = await db.BusTrip.findAll({
      // We need the Bus model to get the capacity
      include: [{ model: db.Bus, as: 'bus', attributes: ['capacity'] }],
    });
    const users = await db.User.findAll();
    
    // Ensure we have data to work with
    if (busTrips.length === 0 || users.length === 0) {
      console.warn('BusTrips or Users not found. Skipping booking seeding.');
      return;
    }

    const bookings = [];
    const busTripSeatMap = new Map(); // To track occupied seats per bus_trip

    for (const busTrip of busTrips) {
      const occupiedSeats = busTripSeatMap.get(busTrip.id) || 0;
      const remainingCapacity = busTrip.bus.capacity - occupiedSeats;

      if (remainingCapacity <= 0) {
        continue;
      }

      // Generate a random number of bookings for this bus trip
      const numBookings = faker.number.int({ min: 1, max: Math.min(5, remainingCapacity) });

      for (let i = 0; i < numBookings; i++) {
        const isGuest = faker.datatype.boolean({ probability: 0.3 });
        const userId = isGuest ? null : faker.helpers.arrayElement(users).id;

        // Create a booking with random passenger counts
        const passengerCount = faker.number.int({ min: 1, max: Math.min(4, remainingCapacity) });
        const adultCount = faker.number.int({ min: 1, max: passengerCount });
        const seatedChildCount = faker.number.int({ min: 0, max: passengerCount - adultCount });
        const lapChildCount = passengerCount - adultCount - seatedChildCount;

        const bookingData = factory.createBooking(
          userId,
          busTrip.id,
          null, // Assuming no return trip for simplicity
          {
            adult_count: adultCount,
            seated_child_count: seatedChildCount,
            lap_child_count: lapChildCount,
          }
        );
        bookings.push(bookingData);

        // Update the occupied seat count for this bus trip
        busTripSeatMap.set(busTrip.id, occupiedSeats + passengerCount);
      }
    }

    await queryInterface.bulkInsert('bookings', bookings);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  },
};