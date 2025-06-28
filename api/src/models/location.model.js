const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

  class Location extends Model {
    static associate(models) {
      this.hasMany(models.Trip, {
        foreignKey: 'departure_location_id',
        as: 'departures'
      });
      this.hasMany(models.Trip, {
        foreignKey: 'arrival_location_id',
        as: 'arrivals'
      });
    }
  }

  Location.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: true,
        unique: true
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'location',
      timestamps: true,
    }
  );

module.exports = Location;