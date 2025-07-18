// seeders/XXXXXXXXXXXXXX-demo-bookings.js
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    const trips = await db.Trip.findAll({
      include: [
        {
          model: db.Bus,
          as: 'bus',
          attributes: ['id', 'capacity'],
        },
      ],
    });

    const users = await db.User.findAll();
    const bookings = [];

    trips.forEach(trip => {
      if (!trip.bus) {
        console.error(`Bus not found for trip ${trip.id}`);
        return;
      }

      const maxBookings = Math.min(trip.bus.capacity, 50);
      const bookingsCount = faker.number.int({
        min: Math.floor(trip.bus.capacity * 0.3),
        max: maxBookings,
      });

      for (let i = 0; i < bookingsCount; i++) {
        const user = faker.helpers.arrayElement(users);
        const passengerCount = faker.number.int({ min: 1, max: 4 });
        const isGuest = faker.datatype.boolean({ probability: 0.3 });
        const userId = isGuest ? null : faker.helpers.arrayElement(users).id;

        bookings.push(
          factory.createBooking(userId, trip.id, {
            is_guest: isGuest,
            booking_type: passengerCount > 1 ? 'group' : 'individual',
            passenger_count: passengerCount,
            total_amount: faker.number.float({
              min: trip.fare * passengerCount * 0.8,
              max: trip.fare * passengerCount * 1.2,
              precision: 2,
            }),
            amount_paid: faker.number.float({
              min: trip.fare * passengerCount * 0.8,
              max: trip.fare * passengerCount * 1.2,
              precision: 2,
            }),
            status: faker.helpers.arrayElement(['confirmed', 'cancelled']),
            payment_status: faker.helpers.arrayElement(['paid', 'pending']),
          }),
        );
      }
    });

    await queryInterface.bulkInsert('bookings', bookings);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  },
};
