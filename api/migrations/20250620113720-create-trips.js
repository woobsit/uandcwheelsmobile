'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable(
      'trips',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        bus_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'buses',
            key: 'id',
          },
        },
        driver_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'drivers',
            key: 'id',
          },
        },
        departure_location: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        arrival_location: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        departure_time: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        estimated_arrival: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        fare: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        status: {
          type: Sequelize.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
          defaultValue: 'scheduled',
        },
        departure_terminal: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        arrival_terminal: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        // <-- This brace closes createTable
        indexes: [
          // Now add indexes here
          {
            fields: ['bus_id'],
          },
          {
            fields: ['departure_time'],
          },
        ],
      },
    );
  },

  async down(queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('trips');
     */
    await queryInterface.dropTable('trips');
  },
};
