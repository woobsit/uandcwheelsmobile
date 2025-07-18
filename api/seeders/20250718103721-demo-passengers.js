// seeders/XXXXXXXXXXXXXX-demo-passengers.js
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    // Get all bookings with their trips
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.Trip,
          as: 'trip',
          include: [
            {
              model: db.Bus,
              as: 'bus',
              attributes: ['capacity'],
            },
          ],
        },
      ],
    });

    const passengers = [];
    const seatMaps = new Map(); // Track seat assignments per trip

    for (const booking of bookings) {
      // Initialize seat map for trip if not exists
      if (!seatMaps.has(booking.trip.id)) {
        const capacity = booking.trip.bus.capacity;
        const seats = Array(capacity)
          .fill()
          .map((_, i) => `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`);
        faker.helpers.shuffle(seats); // Randomize seat order
        seatMaps.set(booking.trip.id, seats);
      }

      const availableSeats = seatMaps.get(booking.trip.id);
      const passengerCount = booking.passenger_count;

      // Take seats from available pool
      const assignedSeats = availableSeats.splice(0, passengerCount);

      // Create primary passenger
      passengers.push(
        factory.createPassenger({
          booking_id: booking.id,
          user_id: booking.is_guest ? null : booking.user_id,
          is_primary: true,
          seat_number: assignedSeats[0],
          name: faker.person.fullName(),
          email: booking.is_guest ? faker.internet.email() : null,
          phone: booking.is_guest ? `0${faker.string.numeric(10)}` : null,
          age: faker.number.int({ min: 18, max: 65 }),
        }),
      );

      // Create companion passengers
      for (let i = 1; i < passengerCount; i++) {
        passengers.push(
          factory.createPassenger({
            booking_id: booking.id,
            is_primary: false,
            seat_number: assignedSeats[i],
            name: faker.person.fullName(),
            age: faker.number.int({ min: 1, max: 100 }),
          }),
        );
      }
    }

    await queryInterface.bulkInsert('passengers', passengers);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('passengers', null, {});
  },
};
