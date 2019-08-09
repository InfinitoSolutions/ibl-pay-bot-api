const { FORMAT_DATE_TIME, DEFAULT_DECIMAL_NUMBER } = require('app/config/app');
const moment = require('moment');

module.exports = (type, headers, buyer) => {
  const createData = headers.map(column => createText[column](type, buyer));
  const joinData = createData.join('');
  return type === 'pdf' ? joinData : createData ;
};

const createText = {
  'AVAILABLE DATE': (type, { available_at }) => verifyString(type, moment(available_at).format(FORMAT_DATE_TIME)),
  'FROM-ID': (type, { from }) => verifyString(type, from._id,),
  'FROM-NAME': (type, { from }) => verifyString(type, from.display_name),
  'FROM-EMAIL': (type, { from }) => verifyString(type, from.email),
  'TO-ID': (type, { to }) => verifyString(type, to._id),
  'TO-NAME': (type, { to }) => verifyString(type, to.display_name),
  'TO-EMAIL': (type, { to }) => verifyString(type, to.email),
  'CURRENCY': (type, { currency }) => verifyString(type, currency),
  'AMOUNT': (type, { amount }) => verifyNumber(type, formatCoin(amount)),
  'ORIGIN ID': (type, { txn_seq, parent_txn_seq }) => verifyString(type, parent_txn_seq ? parent_txn_seq : txn_seq)
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