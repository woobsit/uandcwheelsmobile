'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      data_type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
        allowNull: false,
        defaultValue: 'string',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    // Create default settings
    const defaultSettings = [
      { name: 'website_name', value: 'Bus Booking System', data_type: 'string' },
      { name: 'logo_url', value: '', data_type: 'string' },
      { name: 'base_url', value: 'http://localhost:3000', data_type: 'string' },
      { name: 'contact_email', value: 'contact@example.com', data_type: 'string' },
      { name: 'currency', value: 'USD', data_type: 'string' },
      { name: 'timezone', value: 'UTC', data_type: 'string' },
      { name: 'max_seats_per_booking', value: '5', data_type: 'number' },
      { name: 'is_booking_active', value: 'true', data_type: 'boolean' },
    ];

    await queryInterface.bulkInsert(
      'settings',
      defaultSettings.map(setting => ({
        ...setting,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    );
  },

  down: async queryInterface => {
    await queryInterface.dropTable('settings');
  },
};
