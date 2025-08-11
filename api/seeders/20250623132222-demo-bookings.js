// seeders/XXXXXXXXXXXXXX-demo-bookings.js (Final)
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    // Get all BusTrips, including the Trip and its fare
    const busTrips = await db.BusTrip.findAll({
      include: [
        { model: db.Bus, as: 'bus', attributes: ['capacity'] },
        { model: db.Trip, as: 'trip', attributes: ['fare'] },
      ],
    });
    const users = await db.User.findAll();

    // Ensure we have data to work with
    if (busTrips.length === 0 || users.length === 0) {
      console.warn('BusTrips or Users not found. Skipping booking seeding.');
      return;
    }

    const bookings = [];
    const busTripSeatMap = new Map();

    for (const busTrip of busTrips) {
      if (!busTrip.trip) {
        console.warn(`BusTrip ${busTrip.id} has no associated Trip. Skipping.`);
        continue;
      }

      const occupiedSeats = busTripSeatMap.get(busTrip.id) || 0;
      const remainingCapacity = busTrip.bus.capacity - occupiedSeats;

      if (remainingCapacity <= 0) {
        continue;
      }

      const numBookings = faker.number.int({ min: 1, max: Math.min(5, remainingCapacity) });
      const tripFare = busTrip.trip.fare;

      for (let i = 0; i < numBookings; i++) {
        const isGuest = faker.datatype.boolean({ probability: 0.3 });
        const userId = isGuest ? null : faker.helpers.arrayElement(users).id;

        const adultCount = faker.number.int({ min: 1, max: Math.min(4, remainingCapacity) });
        const seatedChildCount = faker.number.int({ min: 0, max: Math.max(0, remainingCapacity - adultCount) });
        
        // This is the new, corrected logic
        const lapChildCount = faker.number.int({ min: 0, max: adultCount });
        
        const totalSeats = adultCount + seatedChildCount;

        // Check if there are enough seats for this booking
        if (remainingCapacity < totalSeats) {
          console.warn(`Not enough remaining seats for a new booking on BusTrip ${busTrip.id}. Skipping.`);
          continue;
        }

        const totalAmount = tripFare * (adultCount + seatedChildCount);

        const bookingData = factory.createBooking(
          userId,
          busTrip.id,
          null,
          {
            total_amount: totalAmount,
            adult_count: adultCount,
            seated_child_count: seatedChildCount,
            lap_child_count: lapChildCount,
          },
        );
        bookings.push(bookingData);

        // Update the occupied seat count for this bus trip
        busTripSeatMap.set(busTrip.id, occupiedSeats + totalSeats);
      }
    }

    await queryInterface.bulkInsert('bookings', bookings);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  },
};