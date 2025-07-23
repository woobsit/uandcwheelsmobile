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

    await queryInterface.createTable('bus_trips', {
       id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
      bus_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      available_seats: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      departure_time: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled'),
      defaultValue: 'scheduled',
    },
    });
  },

  down: async queryInterface => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('bus_trips');
  },
};
