// src/factories/driverFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createDriver: (overrides = {}) => ({
    name: faker.person.fullName(),
    license_number: `DL${faker.string.alphanumeric(6).toUpperCase()}`,
    phone: `${faker.helpers.arrayElement(['080', '090'])}${faker.string.numeric(8)}`,
    is_active: faker.datatype.boolean(0.8), // 80% active
    ...overrides,
  }),
};
