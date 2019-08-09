const buyerDb = require('app/models/buyer');
const ObjectId = require('mongoose').Types.ObjectId;
const errorConfig = require('app/config/error');
const { reRegisterWallet } = require('app/helpers/neo'); 

module.exports = async (req, res, next) => {
    try {
        const { address, currency, explanation } = req.body;
        const { id } = req.params;

        const buyer = await buyerDb.User.findById(ObjectId(id));

        if (typeof buyer === 'undefined' && !buyer) {
            return next({
                message: 'Buyer not found',
                name: errorConfig.type.VALIDATION_ERROR
            });
        }

        await reRegisterWallet(buyer.neo_wallet, address, currency.toLowerCase());

        res.app.emit('RegisterWallet', req, res, {
            buyer_id: buyer.id,
            address,
            explanation
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