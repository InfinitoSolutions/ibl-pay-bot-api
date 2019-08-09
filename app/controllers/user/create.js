const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const bcrypt = require('bcrypt');
const errorConfig = require('app/config/error');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const uuid = require('uuid');
const ObjectId = require('mongoose').Types.ObjectId;
const { USER_STATUS } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    const { body: { first_name, last_name, role_id, email }, user: { id } } = req;
    const rightNow = new Date();
    const password = await bcrypt.hash(uuid.v4(), saltRounds);
    const data = {
      first_name,
      last_name,
      email,
      role: ObjectId(role_id),
      password,
      status: USER_STATUS.PRE_ACTIVE,
      activation_code: uuid.v4(),
      created_by: ObjectId(id),
      activation_expired_at: rightNow.setDate(rightNow.getDate() + 1)
    };
    
    const user = await botDb.User.create(data);
    const userPopulated = await botDb.User.populate(user, ['role', 'created_by']);

    res.app.emit('UserCreated', req, res, {
      userId: userPopulated.id,
      email: userPopulated.email,
      firstName: userPopulated.first_name,
      activationCode: userPopulated.activation_code
    });

    const result = await serializer(req, userPopulated, userSerializer, { includePermissions: false });
    return res.jsend(result);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};