// src/models/refreshToken.model.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class RefreshToken extends Model {}

RefreshToken.init(
  {
    token: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'refresh_token',
    tableName: 'refresh_tokens',
    timestamps: true,
  },
);

module.exports = RefreshToken;
