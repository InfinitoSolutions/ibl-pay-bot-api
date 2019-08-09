const buyerDb = require('app/models/buyer');
const ObjectId = require('mongoose').Types.ObjectId;
const errorConfig = require('app/config/error');
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require('app/config/app');

const { PAYMENT, TRANSFER } = TRANSACTION_TYPE;

module.exports = async (req, res, next) => {
  try {
    const buyer = await buyerDb.User.findById(req.params.id);

    // Get total expense
    const totalExpenses = await buyerDb.Transaction.aggregate([
      {
        $match: {
          from_user: ObjectId(buyer._id),
          tran_type: { $in: [TRANSFER, PAYMENT] },
          status: TRANSACTION_STATUS.COMPLETED
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$currency', '_id'] },
          total_expense: { $sum: '$amount' }
        }
      }
    ]);

    const wallets = await buyerDb.Wallet.aggregate([
      {
        $match: {
          user_id: ObjectId(buyer._id)
        }
      }
    ]);

    // Combine expenses and balances by Currency symbols from totalExpenses and wallets
    let symbols = [];

    totalExpenses.forEach(({ _id: symbol }) => {
      if (!symbols.includes(symbol)) symbols.push(symbol);
    });
    wallets.forEach(({ currency: symbol }) => {
      if (!symbols.includes(symbol)) symbols.push(symbol);
    });

    // Collect info by Currency symbols
    let summaryInfos = [];
    symbols.forEach(symbol => {
      const summaryInfo = {
        currency: symbol,
        totalExpenses: 0,
        available: 0,
        on_hold: 0,
        balance: 0,
        debit: 0
      };

      const expense = totalExpenses.find(element => element._id === symbol);
      if (expense) summaryInfo.totalExpenses += expense.total_expense;

      const wallet = wallets.find(element => element.currency === symbol);
      if (wallet) {
        let debit = wallet.debit;
        let balance = wallet.balance;
        summaryInfo.balance +=
          typeof balance !== 'undefined' && balance ? balance : 0;
        summaryInfo.debit +=
          typeof debit !== 'undefined' && debit ? debit : 0;
        summaryInfo.on_hold +=
          typeof debit !== 'undefined' && debit ? debit : 0;
        summaryInfo.available = summaryInfo.balance - summaryInfo.debit;
      }

      summaryInfos.push(summaryInfo);
    });

    res.jsend(summaryInfos);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};