const serializer = require('express-serializer');
const userSerializer = require('./buyerBase');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, transaction, options) => {
  if (typeof transaction === 'undefined' || !transaction) {
    return null;
  }

  return {
    id: transaction._id,
    status: transaction.status,
    tran_type: transaction.tran_type,
    bill_id: transaction.bill_id,
    bill_type: transaction.bill_type,
    tx_id: transaction.tx_id,
    request_amount: transaction.request_amount,
    amount: transaction.amount,
    currency: transaction.currency,
    completed_at: transaction.completed_at,
    bot_status: transaction.bot_status,
    created_at: transaction.created_at,
    updated_at: transaction.updated_at,
    to_address: transaction.to_address,
    from_address: transaction.from_address,
    commission_fee: transaction.commission_fee,
    commission_percentage: transaction.commission_percentage,
    meaning: transaction.meaning,
    from: await serializer(req, transaction.from, userSerializer),
    to: await serializer(req, transaction.to, userSerializer),
    sent_date: transaction.sent_date,
    reason_bot: transaction.reason_bot,
    failed_at: transaction.failed_at,
    approved_at: transaction.approved_at,
    processed_at: transaction.processed_at,
    rejected_at: transaction.rejected_at,
    blocked_at: transaction.blocked_at,
    approved_by: transaction.approved_by,
    txn_seq: transaction.txn_seq,
    buyer_id: transaction.buyer_id
  };
};
