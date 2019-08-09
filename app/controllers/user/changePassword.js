const botDb = require('app/models/bot/index');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const { body: { old_password, new_password }, 
      user: { id: userId, last_time_change_password: lastTimeChangePassword, password } 
    } = req;
    const isMatchPassword = await bcrypt.compare(old_password, password);
    if (!isMatchPassword) {
      res.app.emit('ChangePasswordFailed', req, res, {
        userId,
        message: 'Old password is incorrect'
      });

      return next({ message: { old_password: 'Old password is incorrect' } });
    }
    
    if (lastTimeChangePassword && Date.now() - lastTimeChangePassword <= 1000 * 60 * 60) {
      return next({
        message:
          'You have just updated your password within last 60 minutes.' +
            ' You can only request to update password once every 60 minutes.'
      });
    }
  
    const userPopulated = await botDb.User.findById(userId)
      .populate(['role', 'created_by']);
    if (!userPopulated) {
      return next({
        message: { id: 'User not found.' },
        status: errorConfig.status_code.NOT_FOUND
      });
    }
    const lastPasswords = userPopulated.last_passwords;
    const [lastPassword1, lastPassword2] = lastPasswords ?
      lastPasswords.split(',')
      : ['', ''];
    
    if (lastPassword1 && lastPassword2) {
      const matchPromise1 = await bcrypt.compare(
        new_password,
        lastPassword1
      );
      const matchPromise2 = await bcrypt.compare(
        new_password,
        lastPassword2
      );
      const [match1, match2] = await Promise.all([
        matchPromise1,
        matchPromise2
      ]);

      if (match1 || match2) {
        return next({
          message: {
            title: 'Change password failed',
            body: 'You cannot reuse the last 2 previously used passwords'
          }
        });
      } 
    }

    userPopulated.password = await bcrypt.hash(new_password, saltRounds);
    userPopulated.last_passwords = userPopulated.password + ',' + lastPassword1;
    userPopulated.recovery_code = null;
    userPopulated.last_time_change_password = Date.now();

    await userPopulated.save();

    res.app.emit('ChangePasswordSuccess', req, res, { userId });
    
    const result = await serializer(req, userPopulated, userSerializer, 
      { includePermissions: false }
    );
    return res.jsend(result);
    
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};