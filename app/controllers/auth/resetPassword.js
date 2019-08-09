const botDb = require('app/models/bot');
const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({
      recovery_code: req.body.recovery_code
    }).populate(['role', 'created_by']);

    if (!user){
      return next({
        message: 'Recovery code not found or password recovery link has expired.'
      });
    }
    if (Date.now() > user.recovery_expired_at){
      return next({
        message:
          'Your password recovery link has expired. Please use your old password to log in or' +
          'you can click Forgot Password to get a new link for reset password'
      });
    }

    let lastPasswords = user.last_passwords;
    let lastPassword1;
    let lastPassword2;
    if (lastPasswords) {
      [lastPassword1 = '', lastPassword2 = ''] = lastPasswords.split(',');
    } else {
      [lastPassword1, lastPassword2] = ['', ''];
    }
    let matchPromise1 = bcrypt.compare(
      req.body.new_password,
      lastPassword1
    );
    let matchPromise2 = bcrypt.compare(
      req.body.new_password,
      lastPassword2
    );
    let [match1, match2] = await Promise.all([
      matchPromise1,
      matchPromise2
    ]);
    if (match1 || match2) {
      return next({
        message:
          'You are prohibited from re-using the last 2 previously used passwords.'
      });
    } 

    user.password = await bcrypt.hash(
      req.body.new_password,
      saltRounds
    );
    lastPassword2 = lastPassword1;
    lastPassword1 = user.password;
    user.last_passwords = lastPassword1 + ',' + lastPassword2;
    user.recovery_code = null;

    await user.save();

    res.app.emit('ResetPassword', req, res, { userId: user.id });
    
    return res.jsend({});
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};