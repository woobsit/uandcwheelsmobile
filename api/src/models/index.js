const { Sequelize } = require( 'sequelize');
const sequelize = require( '../config/config');
const User = require( './user.model');
const PasswordResetToken = require( './passwordResetToken.model');
const Bus = require( './bus.model');
const Trip = require( './trip.model');
const RevokedToken = require( './revokedToken.model');
const Booking = require( './booking.model');

// No need to call initialize here since it's done in user.model.ts

const db = {
  sequelize,  // The Sequelize instance
  Sequelize,  // Sequelize class
  Bus,
  Trip,
  User,        // Your User model
  PasswordResetToken,
  RevokedToken,
  Booking

};

module.exports = db;