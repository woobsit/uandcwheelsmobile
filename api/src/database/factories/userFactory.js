// src/factories/userFactory.js
const faker = require('@faker-js/faker').faker;
const bcrypt = require('bcryptjs');

module.exports = {
  createUser: async (overrides = {}) => {
    const password = overrides.password || 'password123';

    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: `${faker.helpers.arrayElement(['080', '090'])}${faker.string.numeric(8)}`, // Nigerian format
      address: faker.location.streetAddress(),
      birth_date: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      preferred_payment_method: faker.helpers.arrayElement([
        'credit_card',
        'bank_transfer',
        'cash',
      ]),
      password: await bcrypt.hash(password, 12),
      email_verified_at: faker.datatype.boolean() ? new Date() : null,
      ...overrides,
    };
  },
};
