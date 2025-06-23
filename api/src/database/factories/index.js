// src/factories/index.js
const userFactory = require('./userFactory');
const driverFactory = require('./driverFactory');
const busFactory = require('./busFactory');
const tripFactory = require('./tripFactory');
const bookingFactory = require('./bookingFactory');

module.exports = {
  createUser: userFactory.createUser,
  createDriver: driverFactory.createDriver,
  createBus: busFactory.createBus,
  createTrip: tripFactory.createTrip,
  createBooking: bookingFactory.createBooking
};