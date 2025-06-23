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
    await queryInterface.createTable('buses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      driver_id: {
        type: Sequelize.INTEGER,
        unique: true, // Ensures one-to-one
        references: {
          model: 'drivers',
          key: 'id',
        },
      },
      plate_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      status: {
        type: Sequelize.ENUM('active', 'maintenance', 'retired'),
        defaultValue: 'active',
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

     await queryInterface.addIndex('buses', ['driver_id'], {
      name: 'idx_bus_driver_id'
    });
  },

  down: async queryInterface => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('buses');
  },
};
