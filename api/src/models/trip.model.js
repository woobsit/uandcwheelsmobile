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
    departure_location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrival_location: {
      type: DataTypes.STRING,
      allowNull: false,
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
