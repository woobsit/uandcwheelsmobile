// src/factories/busFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createBus: (overrides = {}) => ({
    plate_number: `${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(3)}${faker.string.alpha(2).toUpperCase()}`,
    brand: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    capacity: faker.number.int({ min: 14, max: 60 }),
    status: faker.helpers.arrayElement(['active', 'maintenance']),
    ...overrides,
  }),
};
