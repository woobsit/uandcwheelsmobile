import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const getDbConfig = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      dialect: 'sqlite',
      storage: ':memory:', // Use in-memory SQLite for tests
      logging: false // Disable logging during tests
    };
  }

  // Existing configuration for other environments
  switch (process.env.NODE_ENV) {
    case 'production':
      return {
        username: process.env.DB_PROD_USER,
        password: process.env.DB_PROD_PASS || undefined,
        database: process.env.DB_PROD_NAME,
        host: process.env.DB_PROD_HOST,
        dialect: 'mysql',
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci'
        }
      };
    default: // development
      return {
        username: process.env.DB_DEV_USER,
        password: process.env.DB_DEV_PASS,
        database: process.env.DB_DEV_NAME,
        host: process.env.DB_DEV_HOST,
        dialect: 'mysql',
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci'
        }
      };
  }
};

const config = getDbConfig();

const dbInstance = new Sequelize({
  database: config.database, // Will be undefined for SQLite
  username: config.username, // Will be undefined for SQLite
  password: config.password, // Will be undefined for SQLite
  host: config.host, // Will be undefined for SQLite
  dialect: config.dialect,
  storage: config.storage, // Only for SQLite
  logging: config.logging,
  dialectOptions: config.dialectOptions,
  pool: process.env.NODE_ENV === 'test' ? undefined : {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection - skip for SQLite in-memory
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await dbInstance.authenticate();
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      process.exit(1);
    }
  })();
}

export default dbInstance;