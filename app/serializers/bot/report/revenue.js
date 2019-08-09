// eslint-disable-next-line no-unused-vars
module.exports = async (req, revenue, options) => {
  if (typeof revenue === 'undefined' || !revenue) {
    return null;
  }

  return {
    id: revenue._id,
    crypto_rate: revenue.crypto_rate,
    currency: revenue._id.currency,
    avg_comm_rate: revenue.avg_comm_rate,
    buyer: revenue.buyer,
    ccy_comm_amount: revenue.ccy_comm_amount,
    no_txn: revenue.no_txn,
    fcy_comm_amount: revenue.fcy_comm_amount,
    transaction_cost: revenue.transaction_cost,
    withdrawal_cost: revenue.withdrawal_cost,
    total_amount: revenue.total_amount
  };
};
