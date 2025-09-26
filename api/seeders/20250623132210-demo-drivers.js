// seeders/XXXXXXXXXXXXXX-demo-drivers.js
'use strict';
const factory = require('../src/database/factories');

module.exports = {
  async up(queryInterface) {
    const drivers = [];
    for (let i = 0; i < 10; i++) {  
      drivers.push(factory.createDriver());
    }
    await queryInterface.bulkInsert('drivers', drivers);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('drivers', null, {});
  },
};
