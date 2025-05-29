import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const getDbConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'test':
      return {
        username: process.env.DB_TEST_USER,
        password: process.env.DB_TEST_PASS || undefined,
        database: process.env.DB_TEST_NAME,
        host: process.env.DB_TEST_HOST,
      };
    case 'production':
      return {
        username: process.env.DB_PROD_USER,
        password: process.env.DB_PROD_PASS || undefined,
        database: process.env.DB_PROD_NAME,
        host: process.env.DB_PROD_HOST,
      };
    default: // development
      return {
        username: process.env.DB_DEV_USER,
        password: process.env.DB_DEV_PASS,
        database: process.env.DB_DEV_NAME,
        host: process.env.DB_DEV_HOST,
      };
  }
};
const { username, password, database, host } = getDbConfig();

// Validate required values
if (!database || !username) {
  console.error('Missing database configuration:');
  console.error(`Database: ${database}`);
  console.error(`Username: ${username}`);
  process.exit(1);
}

console.log('Current DB Config:', {
  username,
  database,
  host,
  hasPassword: !!password // Shows if password exists
});

const dbInstance = new Sequelize(
  database,  // No ! needed now
  username,  // No ! needed now
  password,
  {
    host: host || 'localhost', // Default fallback
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
(async () => {
  try {
    await dbInstance.authenticate();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();

export default dbInstance;