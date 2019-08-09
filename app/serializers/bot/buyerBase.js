const serializer = require('express-serializer');
const addressSerializer = require('./address');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, user, options) => {
  if (typeof user === 'undefined' || !user) {
    return null;
  }

  let item = {
    id: user.origin_id 
      ? user.origin_id
      : user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: user.display_name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
    role: user.role,
    status: user.status,
    activated_at: user.activated_at,
    temporary_address: await serializer(
      req,
      user.temporary_address,
      addressSerializer
    ),
    crypto_currency: user.crypto_currency
  };

  return item;
};
