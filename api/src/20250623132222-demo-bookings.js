// seeders/XXXXXXXXXXXXXX-demo-bookings.js (Final)
'use strict';
const factory = require('./database/factories');
const db = require('./models');
const { faker } = require('@faker-js/faker');
const { generateBookingRef } = require('./utils/bookingHelpers');


module.exports = {
  async up(queryInterface) {


    const busTrips = await db.BusTrip.findAll({
      include: [
        { model: db.Bus, as: 'bus', attributes: ['capacity'] },
        { model: db.Trip, as: 'trip', attributes: ['fare'] },
      ],
    });
    const users = await db.User.findAll();

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
        const seatedChildCount = faker.number.int({
          min: 0,
          max: Math.max(0, remainingCapacity - adultCount),
        });
        const lapChildCount = faker.number.int({ min: 0, max: adultCount });
        const totalSeats = adultCount + seatedChildCount;

        if (remainingCapacity < totalSeats) {
          console.warn(
            `Not enough remaining seats for a new booking on BusTrip ${busTrip.id}. Skipping.`,
          );
          continue;
        }

        const totalAmount = tripFare * (adultCount + seatedChildCount);

        const bookingData = factory.createBooking(userId, busTrip.id, null, {
          total_amount: totalAmount,
          amount_paid: totalAmount, // For seeding, assume all are paid
          adult_count: adultCount,
          seated_child_count: seatedChildCount,
          lap_child_count: lapChildCount,
          booking_reference: generateBookingRef(), // Generate unique reference here
          // Ensure payment method is not null if payment status is 'paid'
          payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'cash']),
          // Ensure phone number has the correct format
          emergency_contact_phone: `0${faker.string.numeric({ length: 10 })}`,
        });
        bookings.push(bookingData);

        busTripSeatMap.set(busTrip.id, occupiedSeats + totalSeats);
      }
    }

    // Use bulkCreate to trigger hooks and validations
    await db.Booking.bulkCreate(bookings);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  },
};
