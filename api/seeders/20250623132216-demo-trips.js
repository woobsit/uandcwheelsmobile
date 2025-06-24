// seeders/XXXXXXXXXXXXXX-demo-trips.js
'use strict';
const { faker } = require('@faker-js/faker'); // Import Faker
const factory = require('../src/database/factories');
const db = require('../src/models');

module.exports = {
  async up(queryInterface) {
    const buses = await db.Bus.findAll();
    const drivers = await db.Driver.findAll();

    const trips = [];

    for (const bus of buses) {
      const tripCount = faker.number.int({ min: 1, max: 4 });
      for (let i = 0; i < tripCount; i++) {
        const randomDriver = drivers[faker.number.int({ min: 0, max: drivers.length - 1 })];

        trips.push(factory.createTrip(bus.id, randomDriver.id));
      }
    }

    await queryInterface.bulkInsert('trips', trips);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('trips', null, {});
  },
};
