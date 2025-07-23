// models/passenger.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class Passenger extends Model {
  static associate(models) {
    this.belongsTo(models.Booking, {
      foreignKey: 'booking_id',
      as: 'booking',
    });
  }
}

Passenger.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('adult', 'lap-child', 'seated-child'),
      allowNull: false,
    },
    requires_seat: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_on_lap: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    next_of_kin_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    next_of_kin_phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^\+?[0-9]{10,15}$/,
      },
    },
    next_of_kin_relationship: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    seat_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'passenger',
    tableName: 'passengers',
    timestamps: true,
    indexes: [{ fields: ['booking_id'] }, { fields: ['type'] }],
  },
);

module.exports = Passenger;
