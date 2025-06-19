const { Sequelize } = require( 'sequelize');
const sequelize = require( '../config/config');
const User = require( './user.model');
const PasswordResetToken = require( './passwordResetToken.model');
const Bus = require( './bus.model');
const Trip = require( './trip.model');
const RevokedToken = require( './revokedToken.model');
const Booking = require( './booking.model');

// No need to call initialize here since it's done in user.model.ts

// Set associations here
Trip.belongsTo(Bus, { foreignKey: 'bus_id' });
Bus.hasMany(Trip, { foreignKey: 'bus_id' });

Booking.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });

Booking.belongsTo(Trip, { foreignKey: 'trip_id' });
Trip.hasMany(Booking, { foreignKey: 'trip_id' });

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