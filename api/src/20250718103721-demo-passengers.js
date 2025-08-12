'use strict';
const factory = require('./database/factories');
const db = require('./models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    const bookings = await db.Booking.findAll({
      // We need to fetch the bus trip to get its capacity
      include: [
        {
          model: db.BusTrip,
          as: 'outbound_bus_trip',
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

    const passengersToInsert = [];
    const seatMaps = new Map();

    for (const booking of bookings) {
      if (!booking.outbound_bus_trip) {
        continue;
      }

      const busTripId = booking.outbound_bus_trip_id;
      const totalSeatsNeeded = booking.adult_count + booking.seated_child_count;

      if (!seatMaps.has(busTripId)) {
        const capacity = booking.outbound_bus_trip.bus.capacity;
        const seats = Array.from({ length: capacity }, (_, i) => i + 1);
        faker.helpers.shuffle(seats);
        seatMaps.set(busTripId, seats);
      }

      const availableSeats = seatMaps.get(busTripId);

      if (availableSeats.length < totalSeatsNeeded) {
        console.warn(`Not enough seats available for booking ${booking.id}. Skipping.`);
        continue;
      }

      // Track primary passenger status
      let isPrimaryAssigned = false;

      // Create adult passengers
      for (let i = 0; i < booking.adult_count; i++) {
        const seatNumber = availableSeats.splice(0, 1)[0];
        passengersToInsert.push(
          factory.createPassenger({
            booking_id: booking.id,
            type: 'adult',
            seat_number: seatNumber,
            is_primary: !isPrimaryAssigned,
          }),
        );
        if (!isPrimaryAssigned) isPrimaryAssigned = true;
      }

      // Create seated child passengers
      for (let i = 0; i < booking.seated_child_count; i++) {
        const seatNumber = availableSeats.splice(0, 1)[0];
        passengersToInsert.push(
          factory.createPassenger({
            booking_id: booking.id,
            type: 'seated-child',
            seat_number: seatNumber,
            is_primary: !isPrimaryAssigned,
          }),
        );
        if (!isPrimaryAssigned) isPrimaryAssigned = true;
      }

      // Create lap child passengers
      for (let i = 0; i < booking.lap_child_count; i++) {
        passengersToInsert.push(
          factory.createPassenger({
            booking_id: booking.id,
            type: 'lap-child',
            seat_number: null, // Lap children don't get a seat number
            is_primary: !isPrimaryAssigned,
          }),
        );
        if (!isPrimaryAssigned) isPrimaryAssigned = true;
      }
    }

    await queryInterface.bulkInsert('passengers', passengersToInsert, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('passengers', null, {});
  },
};
