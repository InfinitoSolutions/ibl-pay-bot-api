const axios = require('axios');

const statusMap = {
  PENDING: 'withdraw.pending',
  REJECTED: 'withdraw.rejected',
  BLOCKED: 'withdraw.blocked',
  APPROVED: 'withdraw.approved'
};

module.exports = async (message, channel) => {
  if (typeof message === 'undefined' || !message ||
    typeof message.content === 'undefined' || !message.content) {
    return channel.ack(message);
  }

  let data = [];
  const content = JSON.parse(message.content.toString());

  if (
    content.type === 'UpdateTransaction' &&
    (Object.keys(statusMap).includes(content.info.status))
  ) {
    /** Notify User when Transaction was rejected or blocked **/
    const updateData = generateBody(statusMap[content.info.status], 
      [{
        transaction_id: content.info.transaction_id,
        recipient_id: content.info.recipient_id,
        status: content.info.status,
        reason: content.info.explanation,
        instruction: content.info.instruction,
      }]);

    data.push(updateData);
  } else if (content.type === 'UpdateBuyer') {
    const updateData = generateBody('account.buyer-updated', [
      {
        changes: content.info.changes,
        reason: content.info.explanation,
        instruction: content.info.instruction,
        recipient_id: content.info.recipient_id
      }
    ]);
    data.push(updateData);
  } else if (content.type === 'UpdateMerchantCommission') {
    // If commission rate was changed
    const updateData = generateBody('merchant.commission-rate-updated', [
      {
        from: content.info.from,
        to: content.info.to,
        reason: content.info.explanation,
        recipient_id: content.info.recipient_id
      }
    ]);

    data.push(updateData);
  } else if (content.type === 'UpdateMerchantWithdrawalPeriod') {
    // If Withdrawal period was changed
    const updateData = generateBody('merchant.withdrawal-period-updated', [
      {
        from: content.info.from,
        to: content.info.to,
        reason: content.info.explanation,
        recipient_id: content.info.recipient_id
      }
    ]);

    data.push(updateData);
  }

  // Just send ACK to channel if nothing to be processed
  if (data.length === 0) {
    return channel.ack(message);
  } 

  for (let i = 0; i < data.length; i++) {
    console.info(`[*] NotifyApp web hook to notify ${data[i].data.type}`);
    console.info('[*] Nofify App content: ', JSON.stringify(data[i]));
    const options = {
      url: `${process.env.WEBHOOK_ENDPOINT}`,
      method: 'post',
      headers: { 'x-api-key': `${process.env.API_KEY}` },
      data: data[i]
    };

    try {
      const { data } = await axios(options);

      console.info('[*] NotifyApp hook successful ', data);
      return channel.ack(message);
    } catch (error) {
      console.error('[*] NotifyApp hook error: ', error.message);
      return channel.ack(message);
    }
  }
};

const generateBody = (type, payloads) => {
  return {
    event: 'notification',
    data: {
      type: type,
      payload: payloads
    }
  };
};
