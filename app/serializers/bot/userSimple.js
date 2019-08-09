const serializer = require('express-serializer');
const roleSerializer = require('./role');

module.exports = async (req, user, options) => {
  return {
    id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    status: user.status,
    role:
      user.role !== null
        ? await serializer(req, user.role, roleSerializer, options)
        : null
  };
};
