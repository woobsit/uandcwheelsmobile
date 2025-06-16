// models/bus.model.js
const { Model, DataTypes } = require( 'sequelize');
const sequelize = require( '../config/config');

class Bus extends Model {

}

Bus.init({
 id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plate_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'retired'),
    defaultValue: 'active'
  }
}, { sequelize, modelName: 'bus', timestamps: true,
  paranoid: true  });

module.exports = Bus;