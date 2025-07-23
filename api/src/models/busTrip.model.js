// models/bus_trip.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class BusTrip extends Model {
  static associate(models) {
    this.belongsTo(models.Bus, {
      foreignKey: 'bus_id',
      as: 'bus',
    });

    this.belongsTo(models.Trip, {
      foreignKey: 'trip_id',
      as: 'trip',
    });

    this.belongsTo(models.Driver, {
      foreignKey: 'driver_id',
      as: 'driver',
    });

    this.hasMany(models.Booking, {
      foreignKey: 'bus_trip_id',
      as: 'bookings',
    });

    this.hasMany(models.Booking, {
      foreignKey: 'return_bus_trip_id',
      as: 'return_bookings',
    });
  }
}

BusTrip.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bus_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    trip_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    available_seats: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    departure_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled'),
      defaultValue: 'scheduled',
    },
  },
  {
    sequelize,
    modelName: 'bus_trip',
    tableName: 'bus_trips',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['bus_id', 'trip_id', 'departure_time'],
      },
    ],
  },
);

module.exports = BusTrip;