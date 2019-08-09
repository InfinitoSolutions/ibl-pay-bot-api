const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
    const { buyer_id, explanation, instruction, address } = data;

    const payload = {
        changed_by: req.user.id,
        buyer_id,
        type: 'Remove wallet',
        new_value: null,
        old_value: address,
        explanation,
        instruction
    };

    rabbitmq.send(
        'changeHistory',
        JSON.stringify({
          type: 'UpdateBuyer',
          info: {
            payload
          }
        })
      );

    return rabbitmq.send(
        'activityLog',
        JSON.stringify({
            type: 'RemoveWallet',
            info: {
                buyer_id,
                address,
                reason: explanation,
                instruction
            },
            changed_by: req.user.id
        })
    );
};