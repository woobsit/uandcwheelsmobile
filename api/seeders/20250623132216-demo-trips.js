// seeders/XXXXXXXXXXXXXX-demo-trips.js
'use strict';
const { faker } = require('@faker-js/faker'); // Import Faker
const factory = require('../src/database/factories');
const db = require('../src/models');

module.exports = {
  async up(queryInterface) {
    // Ensure locations exist before creating trips
    const locationCount = await db.Location.count();
    if (locationCount === 0) {
      await db.Location.bulkCreate(
        Array(20)
          .fill()
          .map(() => factory.createLocation()),
      );
    }
    const buses = await db.Bus.findAll();
    const drivers = await db.Driver.findAll();
    const locations = await db.Location.findAll(); // Get all locations

    const trips = [];

    for (const bus of buses) {
      const tripCount = faker.number.int({ min: 1, max: 4 });
      for (let i = 0; i < tripCount; i++) {
        const randomDriver = drivers[faker.number.int({ min: 0, max: drivers.length - 1 })];

        // Pick two distinct random locations
        let departureLoc, arrivalLoc;
        do {
          departureLoc = locations[Math.floor(Math.random() * locations.length)];
          arrivalLoc = locations[Math.floor(Math.random() * locations.length)];
        } while (departureLoc.id === arrivalLoc.id);

        trips.push(factory.createTrip(bus.id, randomDriver.id, departureLoc.id, arrivalLoc.id));
      }
    }

    await queryInterface.bulkInsert('trips', trips);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('trips', null, {});
  },
};
