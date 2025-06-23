// models/booking.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const { generateBookingRef } = require('../utils/bookingHelpers');

class Booking extends Model {
  static async createBooking(bookingData) {
    return await this.create({
      ...bookingData,
      booking_reference: generateBookingRef(),
    });
  }

  static async getBookingsByUser(userId) {
    return await this.findAll({
      where: { user_id: userId },
      include: ['trip', 'user'],
    });
  }

  static async cancelBooking(bookingId) {
    return await this.update({ status: 'cancelled' }, { where: { id: bookingId } });
  }
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    trip_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trips',
        key: 'id',
      },
    },
    seat_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    booking_reference: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    booking_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['credit_card', 'bank_transfer', 'cash', 'mobile_money', null]],
      },
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled', 'completed'),
      defaultValue: 'confirmed',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'booking',
    tableName: 'bookings',
    timestamps: true,
    paranoid: true, // Enables soft deletion
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['trip_id'],
      },
      {
        fields: ['booking_reference'],
        unique: true,
      },
      {
        fields: ['payment_status'],
      },
      {
        fields: ['status'],
      },
    ],
  },
);

module.exports = Booking;
