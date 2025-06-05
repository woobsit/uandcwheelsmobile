// src/models/passwordResetToken.model.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/config';

class PasswordResetToken extends Model {
  declare email: string;
  declare token: string;
  declare created_at: Date;
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

export default PasswordResetToken;