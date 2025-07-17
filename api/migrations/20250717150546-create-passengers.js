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
      booking_id: {
        type: Sequelize.UUID,
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
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true,
          notEmpty: true, // If provided, should not be empty
        },
      },
      phone: {
        type: Sequelize.STRING(),
        allowNull: true,
        validate: {
          is: /^(0)[0-9]{10}$/, //
        },
      },
      age: {
        type: Sequelize.INTEGER, // Should be number, not string
        allowNull: true,
        validate: {
          min: 0,
          max: 120,
        },
      },
      gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: true,
      },
      seat_number: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          len: [1, 10],
        },
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // Default to false
        allowNull: false, // Should never be null
      },
      // Add relationship to user if passenger is a registered user
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
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
