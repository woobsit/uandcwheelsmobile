// models/bus.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class Bus extends Model {
  static associate(models) {
    this.hasMany(models.BusTrip, {
      foreignKey: 'bus_id',
      as: 'bus',
    });
  }
}

Bus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plate_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    seat_arrangement: {
      type: DataTypes.STRING(10), // e.g., '2-2', '2-1'
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'maintenance', 'retired'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'bus',
    timestamps: true,
    paranoid: true,
    indexes: [
      // ... existing indexes ...
    ],
  },
);

module.exports = Bus;
