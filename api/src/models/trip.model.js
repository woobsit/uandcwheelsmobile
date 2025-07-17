const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class Trip extends Model {
  static associate(models) {
    this.belongsTo(models.Bus, {
      foreignKey: 'bus_id',
      as: 'bus',
    });

    this.belongsTo(models.Driver, {
      foreignKey: 'driver_id',
      as: 'driver',
    });

    //Add associations for locations
    this.belongsTo(models.Location, {
      foreignKey: 'departure_location_id',
      as: 'departureLocation',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'arrival_location_id',
      as: 'arrivalLocation',
    });
  }
}

Trip.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bus_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'buses',
        key: 'id',
      },
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    departure_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    arrival_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    departure_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estimated_arrival: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
    },
    departure_terminal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrival_terminal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'trip',
    timestamps: true,
    indexes: [
      {
        fields: ['bus_id'],
      },
      {
        fields: ['driver_id'],
      },
      {
        fields: ['departure_time'],
      },
      {
        fields: ['status'],
      },
    ],
  },
);

module.exports = Trip;
