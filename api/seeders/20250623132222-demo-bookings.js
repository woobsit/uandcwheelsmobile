'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');
const { generateBookingRef } = require('../src/utils/bookingHelpers');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const busTrips = await db.BusTrip.findAll({
        include: [{ model: db.Bus, as: 'bus', attributes: ['capacity'] }],
        transaction,
      });
      const users = await db.User.findAll({ transaction });

      if (busTrips.length === 0 || users.length === 0) {
        console.warn('BusTrips or Users not found. Skipping booking seeding.');
        return;
      }

      const busTripSeatMap = new Map();

      for (const busTrip of busTrips) {
        if (!busTrip.bus) continue;

        const occupiedSeats = busTripSeatMap.get(busTrip.id) || 0;
        const remainingCapacity = busTrip.bus.capacity - occupiedSeats;

        if (remainingCapacity <= 0) continue;

        const numBookings = faker.number.int({ min: 1, max: Math.min(3, remainingCapacity) });

        for (let i = 0; i < numBookings; i++) {
          const isGuest = faker.datatype.boolean({ probability: 0.3 });
          const userId = isGuest ? null : faker.helpers.arrayElement(users).id;
          const adultCount = faker.number.int({ min: 1, max: Math.min(4, remainingCapacity) });
          const seatedChildCount = faker.number.int({ min: 0, max: Math.max(0, remainingCapacity - adultCount) });
          const lapChildCount = faker.number.int({ min: 0, max: adultCount });
          const totalSeats = adultCount + seatedChildCount;

          if (remainingCapacity < totalSeats) continue;

          // 1. Create the booking record first to get its ID
          const booking = await db.Booking.create(
            factory.createBooking(userId, busTrip.id, null, {
              total_amount: busTrip.fare * totalSeats,
              amount_paid: busTrip.fare * totalSeats,
              adult_count: adultCount,
              seated_child_count: seatedChildCount,
              lap_child_count: lapChildCount,
              booking_reference: generateBookingRef(),
              payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer']),
              emergency_contact_phone: `0${faker.string.numeric({ length: 10 })}`,
            }),
            { transaction }
          );

          // 2. Create the passengers with the new booking ID
          const passengersToInsert = [];
          const availableSeats = Array.from({ length: busTrip.bus.capacity }, (_, i) => i + 1);
          faker.helpers.shuffle(availableSeats);

          let isPrimaryAssigned = false;
          // Create seated passengers (adults and seated children)
          for (let k = 0; k < totalSeats; k++) {
            const seatNumber = availableSeats.pop();
            passengersToInsert.push(
              factory.createPassenger({
                booking_id: booking.id,
                type: k < adultCount ? 'adult' : 'seated-child',
                seat_number: seatNumber,
                is_primary: !isPrimaryAssigned,
              })
            );
            if (!isPrimaryAssigned) isPrimaryAssigned = true;
          }
          // Create lap children (no seats)
          for (let k = 0; k < lapChildCount; k++) {
            passengersToInsert.push(
              factory.createPassenger({
                booking_id: booking.id,
                type: 'lap-child',
                seat_number: null,
                is_on_lap: true,
                is_primary: !isPrimaryAssigned,
              })
            );
            if (!isPrimaryAssigned) isPrimaryAssigned = true;
          }

          // 3. Bulk insert the passengers for this single booking
          await db.Passenger.bulkCreate(passengersToInsert, { transaction });

          busTripSeatMap.set(busTrip.id, occupiedSeats + totalSeats);
        }
      }
      await transaction.commit();
      console.log('Seeding completed successfully with transactions.');
    } catch (error) {
      await transaction.rollback();
      console.error('Seeding failed. Rolling back transaction.', error);
    }
  },

  async down(queryInterface) {
    // This will work correctly, as cascading deletes should handle the passengers
    await queryInterface.bulkDelete('bookings', null, {});
  },
};