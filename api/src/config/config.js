// src/config/config.ts
 const{ Sequelize } =require( 'sequelize'); // Import Options type for better typing
 const dotenv =require( 'dotenv');

dotenv.config();

const getDbConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return {
        username: process.env.DB_PROD_USER,
        password: process.env.DB_PROD_PASS || undefined,
        database: process.env.DB_PROD_NAME,
        host: process.env.DB_PROD_HOST,
        dialect: 'mysql',
        logging: process.env.DB_LOGGING === 'true', // Add logging here
        dialectOptions: {
          charset: 'utf8mb4',
         
        }
      };
    case 'test':
      return {
        username: process.env.DB_TEST_USER || process.env.DB_DEV_USER,
        password: process.env.DB_TEST_PASS || process.env.DB_DEV_PASS || undefined,
        database: process.env.DB_TEST_NAME || process.env.DB_DEV_NAME,
        host: process.env.DB_TEST_HOST || process.env.DB_DEV_HOST,
        dialect: 'mysql',
        logging: process.env.DB_LOGGING === 'true', // Add logging here
        dialectOptions: {
          charset: 'utf8mb4',
         
        }
      };
    default: // development
      return {
        username: process.env.DB_DEV_USER,
        password: process.env.DB_DEV_PASS,
        database: process.env.DB_DEV_NAME,
        host: process.env.DB_DEV_HOST,
        dialect: 'mysql',
        logging: process.env.DB_LOGGING === 'true', // Add logging here
        dialectOptions: {
          charset: 'utf8mb4',
         
        }
      };
  }
};

const config = getDbConfig();

const dbInstance = new Sequelize({
  database: config.database,
  username: config.username,
  password: config.password,
  host: config.host,
  dialect: config.dialect,
  // Now config.logging exists and is boolean, so you can simplify this line:
  logging: config.logging ? console.log : false,
  dialectOptions: config.dialectOptions,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});


  (async () => {
    try {
      await dbInstance.authenticate();
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      process.exit(1);
    }
  })();


module.exports = dbInstance;