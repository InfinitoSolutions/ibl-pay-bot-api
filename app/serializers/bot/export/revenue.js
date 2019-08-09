
const { DEFAULT_DECIMAL_NUMBER } = require('app/config/app');

module.exports = (type, headers, revenue) => {
  const createData = headers.map(column => createText[column](type, revenue));
  const joinData = createData.join('');
  return type === 'pdf' ? joinData : createData ;
};

const createText = {
  'BUYER ID': (type, { buyer }) => verifyString(type, buyer._id),
  'NAME': (type, { buyer }) => verifyString(type, buyer.display_name),
  'EMAIL': (type, { buyer }) => verifyString(type, buyer.email),
  'NUMER TX': (type, { no_txn }) => verifyNumber(type, no_txn),
  'AVERAGE COMMISSION RATE': (type, { avg_comm_rate }) => verifyNumber(type, formatPercentage(avg_comm_rate)),
  'CRYPTO CURRENCY': (type, { _id }) => verifyString(type, _id.currency),
  'CCY COMMISSION AMOUNT': (type, { ccy_comm_amount }) => verifyNumber(type, formatCoin(ccy_comm_amount)), 
  'FCY COMMISSION AMOUNT': (type, { crypto_rate, fcy_comm_amount }) => verifyNumber(type, formatMoney(crypto_rate, fcy_comm_amount)),
  'TRANSACTION COST': (type, { transaction_cost }) => verifyNumber(type, formatCoin(transaction_cost)),
  'WITHDRAWAL COST': (type, { withdrawal_cost }) => verifyNumber(type, formatCoin(withdrawal_cost))
};

const formatPercentage = value => `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })} %`;

const formatCoin = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: DEFAULT_DECIMAL_NUMBER });

const formatMoney = (rate, value) => {
  if (value !== 0 && rate && rate.pair === 'USD-BTC') {
    return `$ ${Number(value).toLocaleString('en-US', { maximumFractionDigits: DEFAULT_DECIMAL_NUMBER })}`;
  }
  if (value !== 0 && rate && rate.pair === 'VND-BTC') {
    return `${Number(value).toLocaleString('en-US', { maximumFractionDigits: DEFAULT_DECIMAL_NUMBER })} đ`;
  }
  return value;
};

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