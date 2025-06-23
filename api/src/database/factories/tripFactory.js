// src/factories/tripFactory.js
const faker = require('@faker-js/faker').faker;
const moment = require('moment');

module.exports = {
  createTrip: (busId, overrides = {}) => {
    const departure = moment().add(faker.number.int({ min: 1, max: 30 }), 'days');

    return {
      bus_id: busId,
      departure_location: faker.location.city(),
      arrival_location: faker.location.city(),
      departure_time: departure.toDate(),
      estimated_arrival: departure
        .clone()
        .add(faker.number.int({ min: 2, max: 12 }), 'hours')
        .toDate(),
      fare: faker.number.float({ min: 1500, max: 15000, precision: 2 }),
      status: 'scheduled',
      ...overrides,
    };
  },
};
