module.exports = transaction => {
  return [
    transaction._id,
    transaction.createdAt,
    transaction.tran_type,
    transaction.bill_type,
    transaction.createdAt,
    transaction.updatedAt,
    transaction.status,
    transaction.currency,
    transaction.request_amount,
    transaction.amount
  ];
};
