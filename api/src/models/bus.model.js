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
    driver_id: {
    type: DataTypes.INTEGER,
    unique: true, // Ensures one-to-one
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'retired'),
    defaultValue: 'active'
  }
}, { sequelize, modelName: 'bus', timestamps: true,
  paranoid: true,  indexes: [
    // ... existing indexes ...
    {
      fields: ['driver_id'], // Optional if you want bidirectional relationship
      unique: true
    }
  ]  });

module.exports = Bus;