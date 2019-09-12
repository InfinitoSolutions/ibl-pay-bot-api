const axios = require('axios');
const errorConfig = require('app/config/error');
const buyerDb = require('app/models/buyer');
const botDb = require('app/models/bot');
const ObjectId = require('mongoose').Types.ObjectId;
const { checkBalance, checkBalanceSystem } = require('app/helpers/utils');
const { TRANSACTION_STATUS, BUYER_STATUS } = require('app/config/app');

const { PENDING, REJECTED, BLOCKED, APPROVED, PROCESSING, FAILED } = TRANSACTION_STATUS;

module.exports = async (req, res, next) => {
  try {
    const { ids: tranIds, status, explanation: reason, instruction } = req.body;
    const updateSet = { bot_status: status };
    const now = new Date();

    switch (status) {
      case PENDING:
        updateSet.reason_bot = reason;
        updateSet.status = status;
        break;
      case REJECTED:
        updateSet.rejected_at = now;
        updateSet.reason_bot = reason;
        updateSet.status = status;
        updateSet.rejected_by = req.user.id;
        break;
      case BLOCKED:
        updateSet.blocked_at = now;
        updateSet.reason_bot = reason;
        updateSet.blocked_by_bot = true;
        updateSet.status = status;
        break;
      case APPROVED:
        updateSet.status = PENDING;
        updateSet.approved_at = now;
        updateSet.approved_by = req.user.id;
        break;
      case PROCESSING:
        updateSet.sent_date = now;
        updateSet.status = status;
        updateSet.sent_by = req.user.id;
        break;
      default:
        break;
    }

    const listTxnId = tranIds.map(txn => ObjectId(txn));
    const transaction = await botDb.Transaction.find({ _id: { $in: listTxnId } });
    // check status of buyer 
    if (transaction) {
      const active = transaction.filter(({ buyer }) => buyer.status !== BUYER_STATUS.ACTIVE);
      if (active.length > 0) {
        return next({
          message: {
            title: 'Invalid Selected',
            body: 'One or more of the transactions you selected have buyer Blocked/Frozen status. Please check your selection again.'
          }
        });
      }
    }

    if (status === PROCESSING || status === REJECTED) {
      let txnApproveList = [];
      let txnFailedList = [];
      // check balance BTC of Master wallet
      const result = await checkBalanceSystem(transaction);
      if (result) {
        const currency = [...new Set(transaction.map(tran => tran.currency))];
        res.app.emit('InsufficientFund', req, res, {
          date: now.toString(),
          transaction,
          amount: result,
          currency,
          email: req.user.email
        });
        return next({
          message: {
            title: 'Insufficient fund in Master address for send fund',
            body: `Please add ${currency} ${result} more to process send fund.`
          }
        });
      }

      const { data: txnList, statusText } = await checkBalance(transaction);
      if (statusText !== 'OK') {
        return next({
          message: 'An internal server error occurred. Please try again later.',
          name: errorConfig.type.INTERNAL_SERVER_ERROR
        });
      }
      if (txnList.status) {
        await callWithdrawal(transaction, status);
      } else {
        const { data } = txnList;
        for (let i = 0; i < data.length; i++) {
          const txId = data[i].txId;
          const status = data[i].status;
          const errorMessage = data[i].msg;

          for (let t = 0; t < transaction.length; t++) {
            const tran = transaction[t];
            if (tran.tx_id === txId) {
              if (status === false) {
                txnFailedList.push(tran);
                const setUpdate = {
                  reason: errorMessage,
                  sent_date: now,
                  failed_at: now,
                  status: FAILED,
                  bot_status: FAILED,
                };
                tran.reason_failed = errorMessage;

                await buyerDb.Transaction.updateOne({ _id: ObjectId(tran._id) }, { $set: setUpdate });
              } else {
                txnApproveList.push(tran);
                await buyerDb.Transaction.updateOne({ _id: ObjectId(tran._id) }, { $set: updateSet });
              }
            }
          }
        }
        if (txnFailedList.length > 0) {
          console.info('Transaction failded list: ', txnFailedList);
          res.app.emit('UnsuccessfullyBlockchain', req, res, {
            txnFailedList,
            email: req.user.email
          });
          res.app.emit('UpdateTransaction', req, res, {
            status: FAILED,
            transaction: txnFailedList,
            instruction,
          });
        }
        if (txnApproveList.length > 0) {
          console.info('Transaction approved list: ', txnApproveList);
          await callWithdrawal(txnApproveList, status);
        }
      }
    }

    if (![PROCESSING, REJECTED].includes(status)) {
      // update status without approved
      const updateTransaction = await buyerDb.Transaction.updateMany(
        { _id: { $in: tranIds } },
        { $set: updateSet }
      );

      if (updateTransaction.ok !== 1) {
        return next({
          message: 'An internal server error occurred. Please try again later.',
          name: errorConfig.type.INTERNAL_SERVER_ERROR
        });
      }

      // Send event to add activity log and send email
      res.app.emit('UpdateTransaction', req, res, {
        transaction,
        status,
        explanation: reason,
        instruction,
      });
    }

    return res.jsend(transaction);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};

const callWithdrawal = async (tran, status) => {
  try {
    const requests = tran.map(({ tx_id, from_address, currency, to_address, amount }) => ({
      txId: tx_id,
      userAddress: from_address,
      currency,
      toAddress: to_address,
      amount: amount * Math.pow(10, 8),
    }));
    const options = {
      url: `${process.env.SERVER_BLOCKCHAIN_WITHDRAWAL}/api/transaction/withdrawal`,
      headers: { 
        'Content-Type': 'application/json'
      },
      method: 'post',
      data: {
        requests,
        rejected: status === REJECTED ? true : false
      }
    };
    const result = await axios(options);
    console.info('call withdraw result: ', result);
  } catch (err) {
    console.error(err);
    return err;
  }
};
