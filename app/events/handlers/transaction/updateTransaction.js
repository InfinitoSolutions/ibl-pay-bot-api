const rabbitmq = require('app/helpers/rabbitmq');
const { TRANSACTION_STATUS, BUYER_STATUS } = require('app/config/app');

const { NEW, PENDING, APPROVED, REJECTED, BLOCKED, PROCESSING, FAILED } = TRANSACTION_STATUS;

module.exports = async (req, res, data) => {
  const promises = [];
  const date = new Date().toString();
  const { transaction, status, explanation, instruction } = data;

  transaction.forEach(async (tran) => {
    const { first_name, last_name, email, origin_id } = tran.buyer;
    let useStatus;
    if (data.updateBuyer) {
      useStatus = status === BUYER_STATUS.ACTIVE ? tran.sub_status : BLOCKED;
    } else {
      useStatus = status;
    }

    const activityLog = rabbitmq.send(
      'activityLog',
      JSON.stringify({
        type: 'UpdateTransaction',
        changed_by: req.user.id,
        info: {
          transaction_id: tran._id,
          status: useStatus,
        }
      })
    );
    promises.push(activityLog);

    const notifyApp = rabbitmq.send(
      'notifyApp',
      JSON.stringify({
        type: 'UpdateTransaction',
        info: {
          transaction_id: tran._id,
          explanation: tran.reason_failed || explanation,
          instruction,
          status: useStatus === NEW ? PENDING : useStatus,
          recipient_id: origin_id.toString()
        }
      })
    );
    promises.push(notifyApp);

    // Not send email if Manager/Operator Send fund for transaction
    if (useStatus !== PROCESSING) {
      let setStatus;
      switch (useStatus) {
        case PENDING:
        case NEW:
          setStatus = 'pended';
          break;
        case APPROVED:
          setStatus = 'approved';
          break;
        case REJECTED:
          setStatus = 'rejected';
          break;
        case BLOCKED:
          setStatus = 'blocked';
          break;
        case FAILED:
          setStatus = 'failed';
          break;
        default:
          setStatus = useStatus;
          break;
      }
      const sendEmail = rabbitmq.send(
        'sendEmail',
        JSON.stringify({
          to: email,
          template: 'updateTransaction',
          params: {
            firstName: first_name,
            lastName: last_name,
            status: setStatus,
            date,
            explanation: tran.reason_failed || explanation,
            instruction,
            currency: tran.currency,
            amount: tran.amount,
            crypto_address: tran.to_address,
            emailSupport: process.env.MAIL_FROM_SUPPORT
          }
        })
      );
      promises.push(sendEmail);
    }

    // Call to blockchain if Send fund to user
    // if (useStatus === PROCESSING) {
    //   const txn = await buyerDb.Transaction.findOne({ _id: tran._id }).populate('from_user');
    //   const cryptoCurrencies = txn.from_user.crypto_currencies;
    //   if (cryptoCurrencies && cryptoCurrencies.length > 0) {
    //     let address = null;
    //     for (let i = 0; i < cryptoCurrencies.length; i++) {
    //       if (cryptoCurrencies[i].currency === 'NEO') {
    //         address = cryptoCurrencies[i].address;
    //       }
    //     }
    //     if (address) {
    //       const submitBlockchain = rabbitmq.send(
    //         'submitBlockchain',
    //         JSON.stringify({
    //           type: 'SendFund',
    //           info: {
    //             transaction_id: tran._id,
    //             address: address,
    //             amount: tran.amount
    //           }
    //         })
    //       );
    //       promises.push(submitBlockchain);
    //     }
    //   }
    // }
  });
  return Promise.all(promises);
};
