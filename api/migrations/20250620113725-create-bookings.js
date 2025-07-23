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
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      outbound_bus_trip_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'bus_trips',
        key: 'id',
    },
     return_bus_trip_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'bus_trips',
        key: 'id',
      },
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
    total_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    amount_paid: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
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
    adult_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lap_child_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seated_child_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_guest: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    guest_email: {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    emergency_contact_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    emergency_contact_phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    });

    // Add composite unique constraint for seat allocation
    await queryInterface.addConstraint('bookings', {
      fields: ['booking_reference'],
      type: 'unique',
      name: 'unique_booking_reference',
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('bookings');
  },
};
