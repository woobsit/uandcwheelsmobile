'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      booking_reference: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      booking_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['credit_card', 'bank_transfer', 'cash', 'mobile_money', null]],
        },
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      booking_type: {
        type: Sequelize.ENUM('individual', 'group'),
        defaultValue: 'individual',
        allowNull: false,
      },
      seats: {
        type: Sequelize.JSON, // Store seat numbers or quantity
        allowNull: false,
        validate: {
          isValid(value) {
            if (this.booking_type === 'individual') {
              if (!Array.isArray(value) || value.length === 0) {
                throw new Error('Must provide seat numbers for individual booking');
              }
            } else {
              if (typeof value !== 'number' || value < 1) {
                throw new Error('Must provide valid seat count for group booking');
              }
            }
          },
        },
      },
      status: {
        type: Sequelize.ENUM('confirmed', 'cancelled', 'completed'),
        defaultValue: 'confirmed',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add composite unique constraint for seat allocation
    await queryInterface.addConstraint('bookings', {
      fields: ['trip_id', 'seat_number'],
      type: 'unique',
      name: 'unique_seat_allocation',
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('bookings');
  },
};
