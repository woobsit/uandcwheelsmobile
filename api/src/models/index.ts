import { Sequelize } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

// No need to call initialize here since it's done in user.model.ts

const db = {
  sequelize,  // The Sequelize instance
  Sequelize,  // Sequelize class
  User        // Your User model
};

export default db;