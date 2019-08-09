const { FORMAT_DATE_TIME, DEFAULT_DECIMAL_NUMBER } = require('app/config/app');
const moment = require('moment');

module.exports = (type, headers, buyer) => {
  const createData = headers.map(column => createText[column](type, buyer));
  const joinData = createData.join('');
  return type === 'pdf' ? joinData : createData ;
};

const createText = {
  'INDEX': (type, index) => index,
  'ID': (type, { origin_id }) => verifyString(type, origin_id),
  'FIRST NAME': (type, { first_name }) => verifyString(type, first_name),
  'LAST NAME': (type, { last_name }) =>  verifyString(type, last_name),
  'DISPLAY NAME': (type, { display_name }) => verifyString(type, display_name),
  'EMAIL': (type, { email }) => verifyString(type, email),
  'JOINED DATE': (type, { activated_at }) => verifyString(type, moment(activated_at).format(FORMAT_DATE_TIME)),
  'CURRENCY': (type, { wallets }) => verifyString(type, wallets ? wallets.currency : ''),
  'AVAILABLE BALANCE': (type, { wallets, index }) => verifyNumber(type, index === 0 ? wallets && formatCoin(wallets.available) : ''),
  'REGISTERED CRYPTO ADDRESS': (type, { crypto_currencies }) => verifyString(type, crypto_currencies ? crypto_currencies.address : ''),
  'LAST LOGIN': (type, { last_login }) => verifyString(type, moment(last_login).format(FORMAT_DATE_TIME)),
  'LAST TXN DATE': (type, { last_tx_at }) => verifyString(type, moment(last_tx_at).format(FORMAT_DATE_TIME)),
  'STATUS': (type, { status }) => verifyString(type, status)
};

const formatCoin = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: DEFAULT_DECIMAL_NUMBER });

const verifyNumber = (type, value) => {
  if (type === 'pdf') {
    return `<td class="number">${value}</td>`;
  }
  return value;
};

const verifyString = (type, value) => {
  if (type === 'pdf') {
    return `<td class="string">${value}</td>`;
  }
  return value;
};