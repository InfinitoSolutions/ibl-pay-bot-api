const serializer = require('express-serializer');
const userSerializer = require('app/serializers/buyer/userBasic');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, tran, options) => {
  if (typeof tran === 'undefined' || !tran) {
    return null;
  }

  return {
    id: tran._id,
    updated_at: tran.updatedAt,
    available_at:
      typeof tran.bill !== 'undefined' &&
      tran.bill &&
      typeof tran.bill.recurring !== 'undefined' &&
      tran.bill.recurring
        ? tran.bill.recurring.next_run_at
        : null,
    tran_type: tran.tran_type,
    tran_meaning: tran.meaning,
    from_user: await serializer(req, tran.sender, userSerializer),
    to_user:
      typeof tran.receiver !== 'undefined' && tran.receiver
        ? await serializer(req, tran.receiver, userSerializer)
        : null,
    bot_status: tran.bot_status,
    currency: tran.currency,
    amount: tran.amount,
    original_txn_id:
      typeof tran.bill !== 'undefined' && tran.bill
        ? tran.bill.parent_txn_seq
        : null,
    status: tran.status
  };
};
