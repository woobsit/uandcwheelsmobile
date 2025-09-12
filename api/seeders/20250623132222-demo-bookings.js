'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');
const { generateBookingRef } = require('../src/utils/bookingHelpers');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch necessary data for seeding within the transaction
      const busTrips = await db.BusTrip.findAll({
        include: [{ model: db.Bus, as: 'bus', attributes: ['capacity'] }, { model: db.Trip, as: 'trip', attributes: ['fare'] }],
        transaction,
      });
      const users = await db.User.findAll({ transaction });

      if (busTrips.length === 0 || users.length === 0) {
        console.warn('BusTrips or Users not found. Skipping booking seeding.');
        await transaction.commit();
        return;
      }

      for (const busTrip of busTrips) {
        if (!busTrip.bus || !busTrip.trip) continue;

        // Get seats already occupied by existing bookings on this trip
        const occupiedSeatsForTrip = await db.Passenger.findAll({
          attributes: ['seat_number'],
          include: [{
            model: db.Booking,
            as: 'booking',
            where: { outbound_bus_trip_id: busTrip.id }
          }],
          where: { seat_number: { [db.Sequelize.Op.ne]: null } },
          transaction,
        });

        const takenSeatNumbers = new Set(occupiedSeatsForTrip.map(p => p.seat_number));
        const allSeats = Array.from({ length: busTrip.bus.capacity }, (_, i) => i + 1);
        
        // Filter out taken seats to create a list of truly available seats
        let availableSeats = allSeats.filter(seat => !takenSeatNumbers.has(seat));
        faker.helpers.shuffle(availableSeats);

        let remainingCapacity = availableSeats.length;
        if (remainingCapacity <= 0) continue;

        // Create a random number of bookings for this trip (max 3 or remaining capacity)
        const maxPossibleBookings = Math.min(3, remainingCapacity);
        const numBookings = faker.number.int({ 
          min: Math.min(1, maxPossibleBookings), 
          max: maxPossibleBookings 
        });

        for (let i = 0; i < numBookings; i++) {
          // Check if we still have capacity
          if (remainingCapacity <= 0) break;

          const isGuest = faker.datatype.boolean({ probability: 0.3 });
          const userId = isGuest ? null : faker.helpers.arrayElement(users).id;
          
          // Ensure we don't try to book more seats than available
          const maxAdults = Math.min(4, remainingCapacity);
          const adultCount = faker.number.int({ 
            min: Math.min(1, maxAdults), 
            max: maxAdults 
          });
          
          const maxSeatedChildren = Math.max(0, remainingCapacity - adultCount);
          const seatedChildCount = faker.number.int({ 
            min: 0, 
            max: maxSeatedChildren 
          });
          
          const lapChildCount = faker.number.int({ min: 0, max: adultCount });
          const totalSeatsNeeded = adultCount + seatedChildCount;

          // Double-check we have enough capacity
          if (remainingCapacity < totalSeatsNeeded) continue;

          // Step 1: Create the Booking record first to get its ID
          const booking = await db.Booking.create(
            factory.createBooking(userId, busTrip.id, null, {
              total_amount: busTrip.trip.fare * totalSeatsNeeded,
              amount_paid: busTrip.trip.fare * totalSeatsNeeded,
              adult_count: adultCount,
              seated_child_count: seatedChildCount,
              lap_child_count: lapChildCount,
              booking_reference: generateBookingRef(),
              payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer']),
              emergency_contact_phone: `0${faker.string.numeric({ length: 10 })}`,
            }),
            { transaction }
          );

          // Step 2: Assign unique seats from the available pool and create passengers
          const passengersToInsert = [];
          const seatsForThisBooking = availableSeats.splice(0, totalSeatsNeeded);

          let isPrimaryAssigned = false;
          // Create seated passengers (adults and seated children)
          for (let k = 0; k < totalSeatsNeeded; k++) {
            const seatNumber = seatsForThisBooking[k];
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

          // Step 3: Bulk insert the passengers for this single booking
          await db.Passenger.bulkCreate(passengersToInsert, { transaction });
          remainingCapacity -= totalSeatsNeeded;
        }
      }
      await transaction.commit();
      console.log('Seeding completed successfully with transactions.');
    } catch (error) {
      await transaction.rollback();
      console.error('Seeding failed. Rolling back transaction.', error);
      throw error; // Re-throw to see the full error stack
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  },
};