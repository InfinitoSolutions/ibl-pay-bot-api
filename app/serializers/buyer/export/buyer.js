const { EXPORT_HEADER:{ BUYER: headers } } = require('app/config/app');
module.exports = buyer => {
  return headers.map( column => createText[column](buyer));
};

const createText = {
  'ID': ({ _id }) => _id,
  'NAME': ({ display_name }) => display_name,
  'EMAIL': ({ email }) => email,
  'JOINED DATE': ({ activated_at }) => activated_at,
  'CURRENCY': ({ wallets }) => wallets.currency,
  'AVAILABLE BALANCE': ({ wallets }) => wallets.available,
  'REGISTED CRYPTO ADDRESS': ({ crypto_currencies }) => crypto_currencies.address,
  'LAST TXN DATE': ({ last_tx_at }) => last_tx_at,
  'STATUS': ({ status }) => status
};
