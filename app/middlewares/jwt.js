const jwt = require('express-jwt');
const blacklist = require('express-jwt-blacklist');
const redisConfig = require('app/config/redis');

blacklist.configure({
  store: {
    type: process.env.JWT_BLACKLIST_STORE_TYPE || 'redis',
    host: redisConfig.host,
    port: redisConfig.port
  }
});

module.exports = (options = {}) => {
  if (typeof options.download !== 'undefined' && options.download) {
    return jwt({
      secret: process.env.JWT_DOWNLOAD_SECRET,
      getToken: req => {
        req.downloadable = options.download;
        return typeof req.query.token !== 'undefined' ? req.query.token : null;
      }
    });
  }

  return jwt({
    secret: process.env.JWT_SECRET,
    isRevoked: blacklist.isRevoked
  });
};
