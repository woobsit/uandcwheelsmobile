// models/driver.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class Driver extends Model {
  static associate(models) {
    this.hasMany(models.Trip, {
      foreignKey: 'driver_id',
      as: 'trips',
    });
  }
}

Driver.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    license_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^(0)[0-9]{10}$/, // Nigerian phone format
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'driver',
    tableName: 'drivers',
    timestamps: true,
    paranoid: true, // Soft deletes
  },
);

module.exports = Driver;
