// src/factories/userFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createPassenger: async (overrides = {}) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: `0${faker.string.numeric(10)}`, // Nigerian format
      age: faker.number.int({ min: 18, max: 65}),
      gender: faker.helpers.arrayElement(['male', 'female']),
      seat_number: ,
      is_primary:,
      user_id:,
      
      ...overrides,
    };
  },
};
