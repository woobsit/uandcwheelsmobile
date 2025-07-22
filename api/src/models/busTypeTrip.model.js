// models/bus_trip.model.js
const { Model, DataTypes } = require('sequelize');

class BusTypeTrip extends Model {
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
  }
}

BusTypeTrip.init(
  {
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
  },
  {
    sequelize,
    modelName: 'bus_type_trip',
    tableName: 'bus_type_trips',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['bus_id', 'trip_id', 'driver_id'],
      },
    ],
  },
);

module.exports = BusTypeTrip;
