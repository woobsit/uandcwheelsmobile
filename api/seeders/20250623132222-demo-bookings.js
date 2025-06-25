// seeders/XXXXXXXXXXXXXX-demo-bookings.js
'use strict';
const factory = require('../src/database/factories');
const db = require('../src/models');
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    // Eager load trips with bus information
    const trips = await db.Trip.findAll({
      include: [{
        model: db.Bus,
        as: 'bus',
        attributes: ['id', 'capacity']
      }]
    });

    const users = await db.User.findAll();
    const bookings = [];
    
    trips.forEach(trip => {
      // Ensure bus is loaded
      if (!trip.bus) {
        console.error(`Bus not found for trip ${trip.id}`);
        return;
      }
      
      const seats = new Set();
      const maxBookings = Math.min(trip.bus.capacity, 50); // Safety cap
      const bookingsCount = faker.number.int({ 
        min: Math.floor(trip.bus.capacity * 0.3), 
        max: maxBookings
      });
      
      for (let i = 0; i < bookingsCount; i++) {
        const user = faker.helpers.arrayElement(users);
        let seat;
        
        // Generate unique seat number
        do {
          seat = `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`;
        } while (seats.has(seat));
        
        seats.add(seat);
        
        bookings.push(factory.createBooking(user.id, trip.id, { 
          seat_number: seat
        }));
      }
    });
    
    await queryInterface.bulkInsert('bookings', bookings);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  }
};