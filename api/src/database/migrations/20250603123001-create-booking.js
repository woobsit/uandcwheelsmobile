// migrations/YYYYMMDDHHMMSS-create-booking.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      // ... (all other fields from model) ...
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add composite unique constraint for seat allocation
    await queryInterface.addConstraint('bookings', {
      fields: ['trip_id', 'seat_number'],
      type: 'unique',
      name: 'unique_seat_allocation'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('bookings');
  }
};