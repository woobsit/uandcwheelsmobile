const { Sequelize } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./user.model');
const PasswordResetToken = require('./passwordResetToken.model');
const Bus = require('./bus.model');
const Trip = require('./trip.model');
const RevokedToken = require('./revokedToken.model');
const Driver = require('./driver.model');
const Booking = require('./booking.model');
const Location = require('./location.model');
const Setting = require('./setting.model');
const RefreshToken = require('./refreshToken.model');

// No need to call initialize here since it's done in user.model.js

const db = {
  sequelize, // The Sequelize instance
  Sequelize, // Sequelize class
  Setting,
  RefreshToken,
  User, // Your User model
  PasswordResetToken,
  RevokedToken,
  Driver,
  Bus,
  Trip,
  Booking,
  Location,
};

// Add this after initializing all models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
