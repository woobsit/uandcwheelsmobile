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
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^(0)[0-9]{10}$/, // Nigerian phone number validation
        },
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      is_active_transport: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_active_logistics: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      preferred_payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['credit_card', 'paypal', 'bank_transfer', 'cash', null]], // Add your payment methods
        },
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      verification_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      remember_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verification_token_expires: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Expiration time for verification token (24 hours after registration)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
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
    await queryInterface.dropTable('users');
  },
};
