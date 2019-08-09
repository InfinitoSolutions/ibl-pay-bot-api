const serializer = require('express-serializer');
const userSerializer = require('./buyerBase');
const userSimple = require('./userSimple');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, transaction, options) => {
  let approved_by;
  if (typeof transaction === 'undefined' || !transaction) {
    return null;
  }

  if (transaction.approved_by) {
    approved_by = await serializer(req, transaction.approved_by, userSimple, { 
      includePermissions: false
    });
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
    external_crypto_address: transaction.external_crypto_address,
    crypto_address: transaction.crypto_address,
    commission_fee: transaction.commission_fee,
    commission_percentage: transaction.commission_percentage,
    buyer: await serializer(req, transaction.buyer, userSerializer),
    sent_date: transaction.sent_date,
    reason_bot: transaction.reason_bot,
    failed_at: transaction.failed_at,
    approved_at: transaction.approved_at,
    processed_at: transaction.processed_at,
    rejected_at: transaction.rejected_at,
    blocked_at: transaction.blocked_at,
    blocked_by_bot: transaction.blocked_by_bot,
    reason_failed: transaction.reason_failed,
    txn_seq: transaction.txn_seq,
    approved_by,
  };
};
