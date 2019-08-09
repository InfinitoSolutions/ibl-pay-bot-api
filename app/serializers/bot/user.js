const serializer = require('express-serializer');
const roleSerializer = require('./role');

module.exports = async (req, user, options) => {
  let item = {
    id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    status: user.status,
    last_time_change_password: user.last_time_change_password,
    buyer_transactions: user.buyer_transactions,
    activation_code: user.activation_code,
    recovery_code: user.recovery_code,
    role:
      user.role !== null
        ? await serializer(req, user.role, roleSerializer, options)
        : null
  };

  if (typeof user.created_by !== 'undefined' && user.created_by) {
    item.created_by = {
      id: user.created_by._id,
      first_name: user.created_by.first_name,
      last_name: user.created_by.last_name,
      email: user.created_by.email,
      created_at: user.created_by.createdAt,
      updated_at: user.created_by.updatedAt,
      role: user.created_by.role,
      status: user.created_by.status,
      last_time_change_password: user.created_by.last_time_change_password
    };
  } else {
    item.created_by = null;
  }

  if (
    typeof options !== 'undefined' &&
    typeof options.withToken !== 'undefined' &&
    options.withToken
  ) {
    item.token = user.token;
  }

  if (
    typeof options !== 'undefined' &&
    typeof options.withRefreshToken !== 'undefined' &&
    options.withRefreshToken
  ) {
    item.refresh_token = user.refresh_token;
  }

  return item;
};
