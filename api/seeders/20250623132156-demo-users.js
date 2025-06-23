// seeders/XXXXXXXXXXXXXX-demo-users.js
'use strict';
const factory = require('../src/database/factories');

module.exports = {
  async up(queryInterface) {
    const users = [];
    for (let i = 0; i < 20; i++) {
      users.push(await factory.createUser());
    }
    await queryInterface.bulkInsert('users', users);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
