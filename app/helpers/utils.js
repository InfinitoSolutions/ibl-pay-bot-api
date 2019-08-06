const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;
const { JWT_DOWNLOAD_EXPIRED_TIME, JWT_EXPIRED_TIME, FORMAT_DATE } = require('app/config/app');
const { SERVER_BLOCKCHAIN_WITHDRAWAL, BTC_BALANCE_URL, MASTER_ADDRESS } = process.env;

module.exports = {
  trimString: s => {
    if (typeof s === 'undefined' || s === null) {
      return null;
    }
    return s.replace(/\s+/g, ' ').trim();
  },

  generateToken: (user, ops) => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expiresIn = ops && ops.download ? ops.zip || JWT_DOWNLOAD_EXPIRED_TIME : JWT_EXPIRED_TIME;
    const role = user.role ? user.role._id : null;
    const tokenData = {
      sub: user.id,
      iat: currentTimestamp,
      nbf: currentTimestamp,
      jti: crypto
        .createHash('md5')
        .update(user.id.toString() + currentTimestamp.toString())
        .digest('hex'),
      metadata: {
        role: role || user.role
      }
    };
    const secretKey = ops && ops.download ? process.env.JWT_DOWNLOAD_SECRET : process.env.JWT_SECRET;
    const token = jwt.sign(tokenData, secretKey,{ expiresIn });
    return token;
  },

  mergeWalletAndCryptoAddress: (wallets, crypto_currencies) => {
    let currencies = [];
    wallets.forEach(({ currency }) => {
      if (!currencies.includes(currency)) currencies.push(currency);
    });
    crypto_currencies.forEach(({ currency }) => {
      if (!currencies.includes(currency)) currencies.push(currency);
    });
    
    return currencies.map(currency => {
      const wallet = {
        currency,
        balance: 0,
        crypto_currencies: [],
        available: 0,
        debit: 0
      };
      crypto_currencies.forEach(({ currency: cryptoCurrency, address }) => {
        if (currency === cryptoCurrency) {
          wallet.crypto_currencies.push(address);
        }
      });
      wallets.forEach(({ currency: cryptoCurrency, debit, balance, available }) => {
        if (currency === cryptoCurrency) {
          wallet.balance += balance;
          wallet.debit += debit,
          wallet.available += available;
        }
      });
      return wallet;
    });
  },
  
  checkBalance: async tran => {
    try {
      const requests = tran.map(({ tx_id, from_address, currency, to_address, amount }) => ({
        txId: tx_id,
        userAddress: from_address,
        currency,
        toAddress: to_address,
        amount: amount * Math.pow(10, 8),
      }));
      const options = {
        url: `${SERVER_BLOCKCHAIN_WITHDRAWAL}/api/transaction/withdrawal-check`,
        method: 'post',
        headers: { 
          'Content-Type': 'application/json',
        },
        data: { requests }
      };
      const data =  await axios(options);
      return data;
    } catch (err) {
      console.error(err);
      return err;
    }
  },

  checkBalanceSystem: async (transaction) => {
    const { data: { confirmed_balance } } = await getBalanceBTC();
    const reducer = (accumulator, { amount }) => accumulator + amount;
    const amount = transaction.reduce(reducer, 0);
    if (amount > Number(confirmed_balance)) {
      const result = amount - Number(confirmed_balance);
      return Number(result).toLocaleString('en-US', { maximumFractionDigits: 8 });
    }
    return false;
  },

  searchByDate: date => {
    let match = {};
    if (moment(date, FORMAT_DATE, true).isValid()) {
      const start = new Date(date).setHours(0,0,0,0);
      const end = new Date(date).setHours(24,59,59,999);
      match.$gte = moment(start).toDate();
      match.$lte = moment(end).toDate();
      return match;
    }
    if (moment(date).isValid()) {
      const time = new Date(date);
      match.$gte = new Date(date);
      match.$lte = moment(time.setSeconds(time.getSeconds() + 59)).toDate();
      return match;
    }
    return null;
  },

  searchById: keyword => {
    const regex = /[0-9A-Fa-f]{24}/g;
    if (regex.test(keyword) && keyword.length == 24) {
      return ObjectId(keyword);
    }
    return keyword;
  },

  filterBalance: (min, max) => {
    const match = {};
    if (min && Number(min)) {
      match.$gte = Number(min);
    }
    if (max && Number(max)) {
      match.$lte = Number(max);
    }
    return match;
  },

  filterDate: (start, end) => {
    const match = {};
    if (start && moment(start).isValid()) {
      match.$gte = moment(start).toDate();
    }
    if (end && moment(end).isValid()) {
      match.$lte = moment(end).toDate();
    }
    return match;
  },
};

const getBalanceBTC = async () => {
  const option = {
    url: `${BTC_BALANCE_URL}/${MASTER_ADDRESS}`,
    method: 'get',
  };
  const { data } = await axios(option);
  return data;
};
