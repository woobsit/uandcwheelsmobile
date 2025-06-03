import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare email_verified_at: Date | null;
  declare password: string;
  declare remember_token: string | null;
  declare verification_token: string | null;
  declare verification_token_expires: Date | null;
  declare created_at:Date;
  declare updated_at: Date;

  static async comparePassword(candidatePassword: string, hashedPassword: string) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Add the static initialize method
  static initialize() {
    this.init({
      id:{type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name:{type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      email_verified_at:{type: DataTypes.STRING,
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
      remember_token:{type: DataTypes.STRING,
        allowNull: true,
      },
      verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiration time for verification token (24 hours after registration)'
      },
      created_at:{type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at:{
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

// Initialize the model right after class definition
User.initialize();

export default User;