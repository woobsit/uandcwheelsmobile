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
      include: [
        'trip',
        'user',
        {
          association: 'passengers',
          attributes: ['name', 'seat_number', 'is_primary'],
        },
      ],
    });
  }

  static async cancelBooking(bookingId) {
    return await this.update(
      { status: 'cancelled' },
      {
        where: { id: bookingId },
        individualHooks: true, // Needed if using paranoid
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
    bus_trip_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trips',
        key: 'id',
      },
    },
    booking_type: {
      type: DataTypes.ENUM('individual', 'group'),
      defaultValue: 'individual',
      allowNull: false,
    },
    // REMOVED seats field - now handled by Passenger model
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
    total_amount: {
      // ADDED for total booking cost
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
    passenger_count: {
      // ADDED for quick access
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    is_guest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
        // Update trip availability if needed
      },
      afterUpdate: async booking => {
        if (booking.changed('status') && booking.status === 'cancelled') {
          // Handle cancellation logic
        }
      },
    },
    indexes: [
      { fields: ['user_id'] },
      { fields: ['bus_trip_id'] },
      { fields: ['booking_reference'], unique: true },
      { fields: ['payment_status'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }, // For reporting
    ],
  },
);

// Define associations in separate file or after init
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

  Booking.belongsTo(models.Trip, {
    foreignKey: 'trip_id',
    as: 'trip',
  });
};

module.exports = Booking;
