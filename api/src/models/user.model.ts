import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/config';
import bcrypt from 'bcryptjs';

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare address: string | null;
  declare birth_date: Date | null;
  declare is_active_transport: boolean;
  declare is_active_logistics: boolean;
  declare preferred_payment_method: string | null;
  declare email_verified_at: Date | null;
  declare password: string;
  declare remember_token: string | null;
  declare verification_token: string | null;
  declare verification_token_expires: Date | null;
  declare created_at: Date;
  declare updated_at: Date;

  static async comparePassword(candidatePassword: string, hashedPassword: string) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static initialize() {
    this.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^(0)[0-9]{10}$/ // Nigerian phone number validation
        }
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      },
      is_active_transport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_active_logistics: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      preferred_payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['credit_card', 'paypal', 'bank_transfer', 'cash', null]] // Add your payment methods
        }
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      verification_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      remember_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      verification_token_expires: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Expiration time for verification token (24 hours after registration)'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'user',
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        }
      }
    });
  }
}

User.initialize();

export default User;