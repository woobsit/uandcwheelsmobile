// src/factories/index.js
const userFactory = require('./userFactory');
const driverFactory = require('./driverFactory');
const busFactory = require('./busFactory');
const tripFactory = require('./tripFactory');
//const bookingFactory = require('./bookingFactory');
const locationFactory = require('./locationFactory');
//const passengerFactory = require('./passengerFactory');

module.exports = {
  createLocation: locationFactory.createLocation,
  createUser: userFactory.createUser,
  //createPassenger: passengerFactory.createPassenger,
  createBus: busFactory.createBus,
  createDriver: driverFactory.createDriver,
  createTrip: tripFactory.createTrip,
  //createBooking: bookingFactory.createBooking,
};
