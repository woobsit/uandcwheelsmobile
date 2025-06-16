// src/models/passwordResetToken.model.ts
const { Model, DataTypes } = require( 'sequelize');
const sequelize = require( '../config/config');

class PasswordResetToken extends Model {
 
}

PasswordResetToken.init({
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'password_reset_token',
  tableName: 'password_reset_tokens',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['token']
    }
  ]
});

module.exports = PasswordResetToken;