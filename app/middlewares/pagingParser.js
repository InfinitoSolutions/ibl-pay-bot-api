const apiConfig = require('app/config/api');

module.exports = async (req, res, next) => {
  if (typeof req.query.limit === 'undefined' || !req.query.limit) {
    req.query.limit = apiConfig.DEFAULT_LIMIT;
  }

  if (typeof req.query.offset === 'undefined' || !req.query.offset) {
    req.query.offset = apiConfig.DEFAULT_OFFSET;
  }

  next();
};
