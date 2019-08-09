const botDb = require('app/models/bot');
const { checkBalanceSystem } = require('app/helpers/utils');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = async (app) => {
    try {
        const transaction = await botDb.Transaction.find({ not_enough_fund: true });
        if (transaction.length === 0) {
            console.info('Don\'t have transaction not enough fund');
            return;
        }
        const operatorId = [...new Set(transaction.map(tran => tran.sent_by))];
        const currency = [...new Set(transaction.map(tran => tran.currency))];
        const result = await checkBalanceSystem(transaction);
        if (!result) return;
        operatorId.forEach(async (ops) => {
            const operator = await botDb.User.find({ _id: ObjectId(ops) });
            app.emit('InsufficientFund', {}, {}, {
                date: new Date().toString(),
                trans: transaction,
                amount: result,
                currency,
                email: operator.email
            });
        });
    } catch (err) {
        console.error('Error cronJob Notification operator: ', err);
    }
};