// seeders/XXXXXXXXXXXXXX-demo-trips.js
'use strict';
const { faker } = require('@faker-js/faker');
const factory = require('../src/database/factories');
const db = require('../src/models');

module.exports = {
  async up(queryInterface) {
    // Ensure locations exist
    const locationCount = await db.Location.count();
    if (locationCount === 0) {
      await db.Location.bulkCreate(
        Array(20)
          .fill()
          .map(() => factory.createLocation())
      );
    }
    
    // Ensure buses and drivers exist
    const busCount = await db.Bus.count();
    if (busCount === 0) {
      await db.Bus.bulkCreate(
        Array(10)
          .fill()
          .map(() => factory.createBus())
      );
    }
    
    const driverCount = await db.Driver.count();
    if (driverCount === 0) {
      await db.Driver.bulkCreate(
        Array(15)
          .fill()
          .map(() => factory.createDriver())
      );
    }
    
    const locations = await db.Location.findAll();
    const buses = await db.Bus.findAll();
    const drivers = await db.Driver.findAll();
    
    // Create trips
    const trips = [];
    for (let i = 0; i < 50; i++) {
      let departureLoc, arrivalLoc;
      do {
        departureLoc = faker.helpers.arrayElement(locations);
        arrivalLoc = faker.helpers.arrayElement(locations);
      } while (departureLoc.id === arrivalLoc.id);
      
      trips.push(factory.createTrip(departureLoc.id, arrivalLoc.id));
    }
    
    // Create trips in DB
    const createdTrips = await db.Trip.bulkCreate(trips, { returning: true });
    
    // Create BusTrip records
    const busTrips = [];
    for (const trip of createdTrips) {
      // Get a bus and driver for this trip
      const bus = faker.helpers.arrayElement(buses);
      const driver = faker.helpers.arrayElement(drivers);
      
      // Create multiple BusTrips for the same trip (different departure times)
      const busTripCount = faker.number.int({ min: 1, max: 3 });
      
      for (let i = 0; i < busTripCount; i++) {
        // Generate random departure time within next 30 days
        const departureTime = new Date();
        departureTime.setDate(departureTime.getDate() + faker.number.int({ min: 1, max: 30 }));
        departureTime.setHours(faker.number.int({ min: 0, max: 23 }));
        departureTime.setMinutes(faker.number.int({ min: 0, max: 59 }));
        
        busTrips.push({
          bus_id: bus.id,
          driver_id: driver.id,
          trip_id: trip.id,
          available_seats: bus.capacity,
          departure_time: departureTime,
          status: 'scheduled'
        });
      }
    }
    
    await queryInterface.bulkInsert('bus_trips', busTrips);
  },

  async down(queryInterface) {
    // Delete in reverse order due to foreign key constraints
    await queryInterface.bulkDelete('bus_trips', null, {});
    await queryInterface.bulkDelete('trips', null, {});
  },
};