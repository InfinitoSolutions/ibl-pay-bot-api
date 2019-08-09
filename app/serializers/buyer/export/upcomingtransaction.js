module.exports = transaction => {
  const receiver = transaction.receiver;
  let receiverName = '';
  if (typeof receiver !== 'undefined' && receiver) {
    receiverName = `${transaction.receiver.first_name} ${
      transaction.receiver.last_name
    }`;
  }
  return [
    transaction._id,
    typeof transaction.bill !== 'undefined' &&
    transaction.bill &&
    typeof transaction.bill.recurring !== 'undefined' &&
    transaction.bill.recurring
      ? transaction.bill.recurring.next_run_at
      : null,
    `${transaction.sender.first_name} ${transaction.sender.last_name}`,
    receiverName,
    transaction.currency,
    transaction.amount,
    typeof transaction.bill !== 'undefined' && transaction.bill
      ? transaction.bill.parent_id
      : null
  ];
};
