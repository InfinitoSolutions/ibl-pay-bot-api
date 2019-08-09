const { DEFAULT_DECIMAL_NUMBER, FORMAT_DATE_TIME } = require('app/config/app');
const moment = require('moment');

module.exports = (type, headers, transaction) => {
  const createData = headers.map(column => createText[column](type, transaction));
  const joinData = createData.join('');
  return type === 'pdf' ? joinData : createData ;
};

const createText = {
  'ID': (type, { txn_seq }) => verifyString(type, txn_seq ? txn_seq : ''),
  'DATE': (type, { created_at }) => verifyString(type, moment(created_at).format(FORMAT_DATE_TIME)),
  'TRANSACTION TYPE': (type, { meaning }) => verifyString(type, meaning),
  'FROM-ID': (type, { from }) => verifyString(type, from ? from._id : ''),
  'FROM-NAME': (type, { from }) => verifyString(type, from ? from.display_name : ''),
  'FROM-EMAIL': (type, { from }) => verifyString(type, from ? from.email : ''),
  'TO_ID': (type, { to }) => verifyString(type, to ? to._id : ''),
  'TO-NAME': (type, { to }) => verifyString(type, to ? to.display_name : ''),
  'TO-EMAIL': (type, { to }) => verifyString(type, to ? to.email : ''),
  'STATUS': (type, { status }) => verifyString(type, status),
  'CURRENCY': (type, { currency }) => verifyString(type, currency),
  'AMOUNT': (type, { amount }) => verifyNumber(type, formatCoin(amount))
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