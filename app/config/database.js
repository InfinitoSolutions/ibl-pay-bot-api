require('dotenv').config();

module.exports = {
  bot: {
    development: {
      username: process.env.BOT_DB_USERNAME || '',
      password: process.env.BOT_DB_PASSWORD || '',
      database: process.env.BOT_DB_NAME,
      host: process.env.BOT_DB_HOST,
      port: 27017
    },
    production: {
      username: process.env.BOT_DB_USERNAME,
      password: process.env.BOT_DB_PASSWORD,
      database: process.env.BOT_DB_NAME,
      host: process.env.BOT_DB_HOST,
      port: 27017
    }
  },
  buyer: {
    development: {
      username: process.env.MONGO_USERNAME || '',
      password: process.env.MONGO_PASSWORD || '',
      database: process.env.MONGO_DB_NAME,
      host: process.env.MONGO_DB_HOST,
      replica: process.env.MONGO_DB_REPLICA,
    },
    production: {
      username: process.env.MONGO_USERNAME,
      password: process.env.MONGO_PASSWORD,
      database: process.env.MONGO_DB_NAME,
      host: process.env.MONGO_DB_HOST,
      replica: process.env.MONGO_DB_REPLICA,
    }
  }
};
