const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  const { buyer_id, changes, displayName, explanation, instruction, blockChainAPIErr, email } = data;

  // Write directly the changelog, not queuing for instant access
  if (!blockChainAPIErr) {
    const payload = changes.map(change => ({
        changed_by: req.user.id,
        buyer_id,
        type: change.type,
        new_value: change.new_value,
        old_value: change.old_value,
        explanation,
        instruction
      })
    );

    rabbitmq.send(
      'changeHistory',
      JSON.stringify({
        type: 'UpdateBuyer',
        info: {
          payload
        }
      })
    );

    rabbitmq.send(
      'notifyApp',
      JSON.stringify({
        type: 'UpdateBuyer',
        info: {
          changes,
          explanation,
          instruction,
          recipient_id: buyer_id
        }
      })
    );
  }

  if (typeof blockChainAPIErr !== 'undefined' && blockChainAPIErr) {
    rabbitmq.send(
      'activityLog',
      JSON.stringify({
        type: 'UpdateBuyerBlockChainAPIError',
        info: {
          buyer_id,
          message: blockChainAPIErr
        },
        changed_by: req.user.id
      })
    );
  }

  return rabbitmq.send(
    'sendEmail',
    JSON.stringify({
      to: email,
      template: 'updateBuyer',
      params: {
        displayName,
        changes,
        explanation,
        instruction,
        emailSupport: process.env.MAIL_FROM_SUPPORT
      }
    })
  );
};
