'use strict';
const factory = require('../src/database/factories');

module.exports = {
  async up(queryInterface) {
    const locations = [];
    const existingNames = new Set();

    // Create 20 unique locations
    while (locations.length < 20) {
      const locationData = factory.createLocation();

      if (!existingNames.has(locationData.name)) {
        existingNames.add(locationData.name);
        locations.push(locationData);
      }
    }

    await queryInterface.bulkInsert('locations', locations);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', null, {});
  },
};
