const serializer = require('express-serializer');
const walletSerializer = require('./wallet');
const transactionSerializer = require('./transaction');
const addressSerializer = require('./address');
const cryptoAddressSerializer = require('./cryptoAddress');

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
    industry: user.industry,
    on_hold: user.on_hold,
    wallets: options && options.basic
        ? null
        : await serializer(req, user.wallets, walletSerializer),
    crypto_currencies: options && options.basic
        ? null
        : await serializer(req, user.crypto_currencies, cryptoAddressSerializer),
    last_transaction: options && options.basic
        ? null
        : await serializer(req, user.last_transaction, transactionSerializer),
    permanent_address: options && options.basic
        ? null
        : await serializer(req, user.permanent_address, addressSerializer),
    temporary_address: options && options.basic
        ? null
        : await serializer(req, user.temporary_address, addressSerializer)
  };
  return item;
};
