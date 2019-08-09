const login = require('./login');
const checkActivation = require('./checkActivation');
const checkRecoveryPassword = require('./checkRecoveryPassword');
const refreshToken = require('./refreshToken');
const requestPassword = require('./requestPassword');
const resetPassword = require('./resetPassword');
const setPassword = require('./setPassword');
const resendActivate = require('./resendActivate');

module.exports = {
  login, 
  checkActivation,
  checkRecoveryPassword,
  refreshToken,
  requestPassword,
  resetPassword,
  setPassword,
  resendActivate
};