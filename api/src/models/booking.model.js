// models/booking.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const { generateBookingRef } = require('../utils/bookingHelpers');
const db = require('../models');


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
      include: [
        {
          association: 'outbound_bus_trip',
          include: [
            { association: 'bus' },
            {
              association: 'trip',
              include: [
                { association: 'departureLocation', as: 'departureLocation' },
                { association: 'arrivalLocation', as: 'arrivalLocation' },
              ],
            },
          ],
        },
        {
          association: 'return_bus_trip',
          include: [
            { association: 'bus' },
            {
              association: 'trip',
              include: [
                { association: 'departureLocation', as: 'departureLocation' },
                { association: 'arrivalLocation', as: 'arrivalLocation' },
              ],
            },
          ],
        },
        'user',
        {
          association: 'passengers',
          attributes: [
            'name',
            'seat_number',
            'is_primary',
            'next_of_kin_name',
            'next_of_kin_phone',
          ],
        },
      ],
    });
  }

  static async cancelBooking(bookingId) {
    return await this.update(
      { status: 'cancelled' },
      {
        where: { id: bookingId },
        individualHooks: true,
      },
    );
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
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    outbound_bus_trip_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bus_trips',
        key: 'id',
      },
    },
    return_bus_trip_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'bus_trips',
        key: 'id',
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
        isIn: [['credit_card', 'bank_transfer', 'cash', null]],
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
    adult_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lap_child_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seated_child_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_guest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    guest_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    emergency_contact_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergency_contact_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'booking',
    tableName: 'bookings',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeValidate: booking => {
        if (booking.notes) booking.notes = booking.notes.trim();
      },
      afterCreate: async booking => {
        // Update trip availability
        await updateBusTripSeats(booking.outbound_bus_trip_id, -booking.total_seats);
        if (booking.return_bus_trip_id) {
          await updateBusTripSeats(booking.return_bus_trip_id, -booking.total_seats);
        }
      },
      afterUpdate: async booking => {
        if (booking.changed('status') && booking.status === 'cancelled') {
          // Restore seats when cancelled
          await updateBusTripSeats(booking.outbound_bus_trip_id, booking.total_seats);
          if (booking.return_bus_trip_id) {
            await updateBusTripSeats(booking.return_bus_trip_id, booking.total_seats);
          }
        }
      },
    },
    indexes: [
      { fields: ['user_id'] },
      { fields: ['outbound_bus_trip_id'] },
      { fields: ['return_bus_trip_id'] },
      { fields: ['booking_reference'], unique: true },
      { fields: ['payment_status'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  },
);

async function updateBusTripSeats(busTripId, seatDelta) {
  const busTrip = await db.BusTrip.findByPk(busTripId);
  if (busTrip) {
    await busTrip.update({
      available_seats: busTrip.available_seats + seatDelta,
    });
  }
}

// Define associations
Booking.associate = models => {
  Booking.hasMany(models.Passenger, {
    foreignKey: 'booking_id',
    as: 'passengers',
    onDelete: 'CASCADE',
  });

  Booking.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  Booking.belongsTo(models.BusTrip, {
    foreignKey: 'outbound_bus_trip_id',
    as: 'outbound_bus_trip',
  });

  Booking.belongsTo(models.BusTrip, {
    foreignKey: 'return_bus_trip_id',
    as: 'return_bus_trip',
  });
};

module.exports = Booking;
