// seeders/XXXXXXXXXXXXXX-demo-passengers.js (Final)
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    // Get all bookings with their associated bus_trip and bus,
    // which holds the capacity
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.BusTrip, // Assuming Booking has a belongsTo relationship with BusTrip
          as: 'bus_trip',
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
    const seatMaps = new Map(); // Track seat assignments per bus_trip

    for (const booking of bookings) {
      if (!booking.bus_trip) {
        continue;
      }
      
      const busTripId = booking.bus_trip.id;
      
      // Initialize seat map for bus trip if not exists
      if (!seatMaps.has(busTripId)) {
        const capacity = booking.bus_trip.bus.capacity;
        const seats = Array(capacity)
          .fill()
          .map((_, i) => `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`);
        faker.helpers.shuffle(seats); // Randomize seat order
        seatMaps.set(busTripId, seats);
      }

      const availableSeats = seatMaps.get(busTripId);
      const passengerCount = booking.passenger_count;

      if (availableSeats.length < passengerCount) {
          console.warn(`Not enough seats for booking ${booking.id}. Skipping.`);
          continue;
      }

      // Create primary passenger
      passengers.push(
        factory.createPassenger({
          booking_id: booking.id,
          is_primary: true,
          seat_number: availableSeats.splice(0, 1)[0],
        }),
      );

      // Create companion passengers
      for (let i = 1; i < passengerCount; i++) {
        passengers.push(
          factory.createPassenger({
            booking_id: booking.id,
            is_primary: false,
            seat_number: availableSeats.splice(0, 1)[0],
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