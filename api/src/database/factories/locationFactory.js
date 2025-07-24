const { faker } = require('@faker-js/faker');

module.exports = {
  createLocation: (overrides = {}) => {
    return {
      name: overrides.name || faker.location.city(),
      state: overrides.state || faker.string.alpha({ length: 3, casing: 'upper' }),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },
};
