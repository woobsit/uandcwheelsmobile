// src/models/passwordResetToken.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class PasswordResetToken extends Model {}

PasswordResetToken.init(
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    code: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Expiration time for password reset token (15 minutes after registration)',
    },
  },
  {
    sequelize,
    modelName: 'password_reset_token',
    tableName: 'password_reset_tokens',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['code'],
      },
    ],
  },
);

module.exports = PasswordResetToken;
