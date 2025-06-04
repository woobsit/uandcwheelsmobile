// migrations/XXXXXXXXXXXXXX-create-password-reset-tokens.ts
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('password_reset_tokens', {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('password_reset_tokens', ['token'], {
      name: 'password_reset_tokens_token_index',
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('password_reset_tokens');
  }
};