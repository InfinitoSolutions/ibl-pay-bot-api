const buyerDb = require('app/models/buyer');
const ObjectId = require('mongoose').Types.ObjectId;
const errorConfig = require('app/config/error');
const { removeWallet } = require('app/helpers/neo'); 

module.exports = async (req, res, next) => {
    try {
        const { address, currency, explanation, instruction } = req.body;
        const { id } = req.params;

        const buyer = await buyerDb.User.findById(ObjectId(id));

        if (typeof buyer === 'undefined' && !buyer) {
            return next({
                message: 'Buyer not found',
                name: errorConfig.type.VALIDATION_ERROR
            });
        }

        const updateAddress = buyer.crypto_currencies.filter(c => c.address !== address && c.currency === currency);
        buyer.crypto_currencies = updateAddress;
        buyer.save();

        await removeWallet(address, currency.toLowerCase());

        res.app.emit('RemoveWallet', req, res, {
            buyer_id: buyer.id,
            address,
            explanation,
            instruction
        });

        return res.jsend(buyer);
    } catch (error) {
        console.error(error);
        return next({
            message: 'An internal server error occurred. Please try again later.',
            name: errorConfig.type.INTERNAL_SERVER_ERROR
        });
    }
};