const apiConfig = require('app/config/api');

module.exports = (req, res, next) => {
  if (typeof req.query.options === 'undefined' || !req.query.options) {
    req.options = {
      paging: {
        limit: apiConfig.DEFAULT_LIMIT,
        offset: apiConfig.DEFAULT_OFFSET
      }
    };
  } else {
    req.options = JSON.parse(req.query.options);
  }

  if (typeof req.options.paging === 'undefined' || !req.options.paging) {
    req.options.paging = {
      limit: apiConfig.DEFAULT_LIMIT,
      offset: apiConfig.DEFAULT_OFFSET
    };
  }

  if (
    typeof req.options.paging.limit === 'undefined' ||
    !req.options.paging.limit
  ) {
    req.options.paging.limit = apiConfig.DEFAULT_LIMIT;
  }

  if (
    typeof req.options.paging.offset === 'undefined' ||
    !req.options.paging.offset
  ) {
    req.options.paging.offset = apiConfig.DEFAULT_OFFSET;
  }

  next();
};
