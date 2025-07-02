// seeders/XXXXXXXXXXXXXX-demo-buses.js
'use strict';
const factory = require('../src/database/factories');

module.exports = {
  async up(queryInterface) {
    const buses = [];
    for (let i = 0; i < 15; i++) {
      buses.push(factory.createBus());
    }
    await queryInterface.bulkInsert('buses', buses);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('buses', null, {});
  },
};
