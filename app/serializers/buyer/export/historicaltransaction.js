module.exports = transaction => {
  const receiver = transaction.receiver;
  let receiverName = '';
  if (typeof receiver !== 'undefined' && receiver) {
    receiverName = `${receiver.first_name} ${receiver.last_name}`;
  }
  const sender = transaction.sender;
  let senderName = '';
  if (typeof sender !== 'undefined' && sender) {
    senderName = `${sender.first_name} ${sender.last_name}`;
  }
  return [
    transaction._id,
    transaction.updatedAt,
    transaction.meaning,
    senderName,
    receiverName,
    transaction.status,
    transaction.currency,
    transaction.amount
  ];
};
