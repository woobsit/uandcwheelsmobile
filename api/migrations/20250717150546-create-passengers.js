'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('passengers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // Should never be null
        references: {
          model: 'bookings', // Ensure this matches your booking table name
          key: 'id',
        },
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100], // Minimum 2 characters, max 100
        },
      },
      age: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM('adult', 'lap-child', 'seated-child'),
      allowNull: false,
    },
    requires_seat: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    is_on_lap: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    next_of_kin_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    next_of_kin_phone: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        is: /^\+?[0-9]{10,15}$/,
      },
    },
    next_of_kin_relationship: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    seat_number: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    is_primary: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
