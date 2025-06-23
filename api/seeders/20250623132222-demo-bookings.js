// seeders/XXXXXXXXXXXXXX-demo-bookings.js
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker'); // Import Faker

module.exports = {
  async up(queryInterface) {
    const users = await db.User.findAll();
    const trips = await db.Trip.findAll();
    const bookings = [];

    trips.forEach(trip => {
      const seats = new Set();
      const bookingsCount = faker.number.int({ min: 5, max: trip.bus.capacity });

      for (let i = 0; i < bookingsCount; i++) {
        const user = faker.helpers.arrayElement(users);
        let seat;

        // Ensure unique seats per trip
        do {
          seat = factory.createBooking(user.id, trip.id).seat_number;
        } while (seats.has(seat));

        seats.add(seat);
        bookings.push(factory.createBooking(user.id, trip.id, { seat_number: seat }));
      }
    });

    await queryInterface.bulkInsert('bookings', bookings);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  },
};
