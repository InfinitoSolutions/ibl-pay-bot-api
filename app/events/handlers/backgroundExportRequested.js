const rabbitmq = require('app/helpers/rabbitmq');

module.exports = async (req, res, data) => {
  return rabbitmq.send(
    'export',
    JSON.stringify(data, (key, value) => {
      if (value instanceof RegExp) {
        return '__REGEXP ' + value.toString();
      }

      return value;
    })
  );
};
