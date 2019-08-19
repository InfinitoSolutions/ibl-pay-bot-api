const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;
const CryptoJS = require('crypto-js');
const { JWT_DOWNLOAD_EXPIRED_TIME, JWT_EXPIRED_TIME, FORMAT_DATE } = require('app/config/app');
const { SERVER_BLOCKCHAIN_WITHDRAWAL, IF_API, IF_API_KEY, IF_SECRET, MASTER_ADDRESS } = process.env;

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
      const { tx_id, from_address, currency, to_address, amount } = tran;
      const options = {
        url: `${SERVER_BLOCKCHAIN_WITHDRAWAL}/api/transaction/withdrawal-check`,
        method: 'post',
        headers: { 
          'Content-Type': 'application/json',
        //   'Authorization': `Bearer ${process.env.SERVER_BLOCKCHAIN_TOCKEN}`
        },
        data: {
          txId: tx_id,
          userAddress: from_address,
          currency: currency,
          toAddress: to_address,
          amount: amount * Math.pow(10, 8),
        }
      };
      const { data } =  await axios(options);
      console.info('Withdrawal check balance:  ', data);
      return { data };
    } catch (err) {
      console.error(err);
    }
  },

  checkBalanceSystem: async (transaction) => {
    const { access_token } = await getTokenAPI();
    const confirmed_balance = await getBalanceBTC(access_token);
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

const getBalanceBTC = async (token) => {
  try {
    const option = {
      url: `${IF_API}/chains/v1/BTC/addr/${MASTER_ADDRESS}/balance`,
      headers: { Authorization: 'Bearer ' + token },
      method: 'get',
    };
    const { data: { data } } = await axios(option);
    console.log('Check balance BTC : ', data);
    const balance = Number(((data.balance + data.unconfirmed_balance) * 1e-8).toFixed(8));
    return balance;
  } catch (err) {
    console.log('Get balance BTC error : ', err);
  }
};

const getTokenAPI = async () => {
  try {
    const expired = Math.floor(new Date().getTime() / 1000) + 3 * 3600;
    const body = {
        api_key: IF_API_KEY,
        expired,
        grant_type: 'client_credentials'
    };
    const signString = `${IF_SECRET}\nPOST\n/iam/token\n${JSON.stringify(body)}`;
    const signature = CryptoJS.SHA256(signString).toString();
    
    const option = {
      url: `${IF_API}/iam/token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      },
      data: JSON.stringify(body)
    };
    const { data: { data } } = await axios(option);
    return data;
  } catch (err) {
    console.log('Get Token Infinito error : ', err);
  }
};
