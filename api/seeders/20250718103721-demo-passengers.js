'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    // 1. Get ALL bookings from the database.
    // We must include the associated BusTrip and Bus to get the total capacity.
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.BusTrip,
          as: 'outbound_bus_trip', // Use the correct alias from your model association
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
    const seatMaps = new Map(); // Tracks assigned seats for each bus_trip to avoid duplicates

    for (const booking of bookings) {
      // Check if the booking has an associated outbound bus trip
      if (!booking.outbound_bus_trip) {
        console.warn(`Booking ${booking.id} has no outbound bus trip. Skipping passenger seeding.`);
        continue;
      }
      
      const busTripId = booking.outbound_bus_trip_id;
      const totalPassengers = booking.adult_count + booking.seated_child_count + booking.lap_child_count;

      // 2. Initialize seat map for the bus trip if it doesn't exist
      if (!seatMaps.has(busTripId)) {
        const capacity = booking.outbound_bus_trip.bus.capacity;
        const seats = Array.from({ length: capacity }, (_, i) => i + 1); // Generate seats from 1 to capacity
        faker.helpers.shuffle(seats); // Randomize seat order
        seatMaps.set(busTripId, seats);
      }

      const availableSeats = seatMaps.get(busTripId);

      if (availableSeats.length < totalPassengers) {
        console.warn(`Not enough seats available for booking ${booking.id}. Skipping.`);
        continue;
      }
      
      // 3. Create passengers for this specific booking
      for (let i = 0; i < totalPassengers; i++) {
        // Pop a seat from the available list
        const seatNumber = availableSeats.splice(0, 1)[0];
        
        // Use the factory with the actual booking ID
        const passengerData = factory.createPassenger({
          booking_id: booking.id,
          seat_number: seatNumber,
          is_primary: i === 0, // The first passenger is the primary booker
        });

        // Push the generated passenger data to the array for bulk insertion
        passengersToInsert.push(passengerData);
      }
    }

    // 4. Bulk insert all passengers
    await queryInterface.bulkInsert('passengers', passengersToInsert, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('passengers', null, {});
  },
};