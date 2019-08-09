const changeHistory = require('./changeHistory');
const dowload = require('./dowload');
const getList = require('./getList');
const getOne = require('./getOne');
const summary = require('./summary');
const transactionHistory = require('./transactionHistory');
const update = require('./update');
const withdrawWaiting = require('./withdrawWaiting');
const registerWallet = require('./reRegisterWallet');
const removeWallet = require('./removeWallet');

module.exports = {
  changeHistory,
  dowload,
  getList,
  getOne,
  summary,
  transactionHistory,
  update,
  withdrawWaiting,
  registerWallet,
  removeWallet
};
