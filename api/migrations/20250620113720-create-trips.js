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
        departure_location_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    arrival_location_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
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
            fields: ['status'],
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
