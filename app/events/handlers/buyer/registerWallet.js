const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
    const { buyer_id, explanation, address } = data;

    rabbitmq.send(
        'activityLog',
        JSON.stringify({
            type: 'RegisterWallet',
            info: {
                buyer_id,
                address,
                reason: explanation,
            },
            changed_by: req.user.id
        })
    );
};