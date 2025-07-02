const { faker } = require('@faker-js/faker');

module.exports = {
  createLocation: (overrides = {}) => {
    return {
      name: overrides.name || faker.location.city(),
      code: overrides.code || faker.string.alpha({ length: 3, casing: 'upper' }),
      timezone:
        overrides.timezone ||
        faker.helpers.arrayElement([
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
        ]),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },
};
