module.exports = Object.freeze({
  type: {
    VALIDATION_ERROR: 'ValidationError',
    COMMON_ERROR: 'Error',
    UNAUTHORIZED_ERROR: 'UnauthorizedError',
    UNAUTHENTICATED_ERROR: 'UnauthenticatedError',
    NOT_FOUND_ERROR: 'NotFoundError',
    INTERNAL_SERVER_ERROR: 'InternalServerError',
    TOKEN_EXPIRED_ERROR: 'TokenExpiredError'
  },
  status_code: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SUCCESS: 200,
    INTERNAL_SERVER_ERROR: 500
  }
});
