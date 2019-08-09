/* eslint-disable no-unused-vars */
module.exports = async (req, wallet, options) => {
  if (typeof wallet === 'undefined' || !wallet) {
    return null;
  }

  return {
    id: wallet._id,
    user_id: wallet.user_id,
    address: wallet.address,
    currency: wallet.currency,
    available_balance: wallet.balance - (wallet.debit ? wallet.debit : 0)
  };
};
