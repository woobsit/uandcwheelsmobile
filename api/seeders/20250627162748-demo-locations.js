'use strict';
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    const locations = [];
    const usedNames = new Set();
    
    // Generate 20 unique locations
    while (locations.length < 20) {
      const name = faker.location.city();
      if (!usedNames.has(name)) {
        usedNames.add(name);
        locations.push({
          name: name,
          code: faker.string.alpha(3).toUpperCase(),
          timezone: faker.helpers.arrayElement([
            'America/New_York', 
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles'
          ]),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert('locations', locations);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', null, {});
  }
};