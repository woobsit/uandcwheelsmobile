const { Sequelize } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./user.model');
const PasswordResetToken = require('./passwordResetToken.model');
const Bus = require('./bus.model');
const Trip = require('./trip.model');
const RevokedToken = require('./revokedToken.model');
const Driver = require('./driver.model');
const Booking = require('./booking.model');

// No need to call initialize here since it's done in user.model.ts

// Trip.hasMany(Driver, {
//   foreignKey: 'driver_id',
//   as: 'driver',
// });

// Trip.hasMany(Bus, {
//   foreignKey: 'bus_id',
//   as: 'bus', // Alias for when you fetch the associated bus
// });

const db = {
  sequelize, // The Sequelize instance
  Sequelize, // Sequelize class
  User, // Your User model
  PasswordResetToken,
  RevokedToken,
  Driver,
  Bus,
  Trip,
  Booking,
};

module.exports = db;
