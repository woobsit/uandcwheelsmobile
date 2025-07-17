const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class Passenger extends Model {
  static initialize() {
    this.init(
      {
        booking_id: {
          type: DataTypes.UUID,
          allowNull: false, // Should never be null
          references: {
            model: 'bookings', // Ensure this matches your booking table name
            key: 'id'
          }
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [2, 100] // Minimum 2 characters, max 100
          }
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: true,
          validate: {
            isEmail: true,
            notEmpty: true // If provided, should not be empty
          }
        },
        phone: {
          type: DataTypes.STRING(), 
          allowNull: true,
          validate: {
            is: /^(0)[0-9]{10}$/ // 
          }
        },
        age: {
          type: DataTypes.INTEGER, // Should be number, not string
          allowNull: true,
          validate: {
            min: 0,
            max: 120
          }
        },
        gender: {
          type: DataTypes.ENUM('male', 'female'),
          allowNull: true
        },
        seat_number: {
          type: DataTypes.STRING(10),
          allowNull: true,
          validate: {
            len: [1, 10]
          }
        },
        is_primary: {
          type: DataTypes.BOOLEAN,
          defaultValue: false, // Default to false
          allowNull: false // Should never be null
        },
        // Add relationship to user if passenger is a registered user
        user_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'passenger',
        tableName: 'passengers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          // Add indexes for common queries
          { fields: ['booking_id'] },
          { fields: ['user_id'] },
          { fields: ['is_primary'] }
        ],
        hooks: {
          beforeValidate: (passenger) => {
            // Trim string fields
            if (passenger.name) passenger.name = passenger.name.trim();
            if (passenger.email) passenger.email = passenger.email.trim().toLowerCase();
            if (passenger.phone) passenger.phone = passenger.phone.trim();
          }
        }
      }
    );
  }
}

Passenger.initialize();

module.exports = Passenger;