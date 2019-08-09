module.exports = {
  host: process.env.RABBITMQ_HOST || 'rabbitmq',
  user: process.env.RABBITMQ_DEFAULT_USER,
  pass: process.env.RABBITMQ_DEFAULT_PASS
};
