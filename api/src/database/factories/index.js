// src/factories/index.js
const userFactory = require('./userFactory');
const driverFactory = require('./driverFactory');
const busFactory = require('./busFactory');
const tripFactory = require('./tripFactory');
const bookingFactory = require('./bookingFactory');

module.exports = {
  createUser: userFactory.createUser,
  createBus: busFactory.createBus,
  createDriver: driverFactory.createDriver,
  createTrip: tripFactory.createTrip,
  createBooking: bookingFactory.createBooking,
};
