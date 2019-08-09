const errorConfig = require('app/config/error');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  // Set default
  console.error(err);
  err.name =
    typeof err.name === 'undefined' ? errorConfig.type.COMMON_ERROR : err.name;
  err.message =
    typeof err.message === 'undefined'
      ? 'An internal server error occurred. Please try again later.'
      : err.message;
  err.status = errorConfig.status_code.BAD_REQUEST;
  switch (err.name) {
    case errorConfig.type.VALIDATION_ERROR:
      err.message = {};
      if (typeof err.errors !== 'undefined') {
        err.errors.forEach(v => {
          err.message[v.field] = v.message;
        });
      }
      break;
    case errorConfig.type.UNAUTHORIZED_ERROR:
      if (
        typeof err.inner !== 'undefined' &&
        err.inner.name === errorConfig.type.TOKEN_EXPIRED_ERROR
      ) {
        err.message = {
          title: 'Session timeout',
          body: 'Your session has been expired, please Login again.'
        };
      }
      err.status = errorConfig.status_code.FORBIDDEN;
      break;
    case errorConfig.type.UNAUTHENTICATED_ERROR:
      err.status = errorConfig.status_code.UNAUTHORIZED;
      break;
    case errorConfig.type.NOT_FOUND_ERROR:
      err.status = errorConfig.status_code.NOT_FOUND;
      break;
    case errorConfig.type.INTERNAL_SERVER_ERROR:
      err.status = errorConfig.status_code.INTERNAL_SERVER_ERROR;
      break;
    default:
      break;
  }

  return res.status(err.status).jerror(err.code, err.message);
};
