const botDb = require('app/models/bot/index');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const uuid = require('uuid');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const { params: { id: userId } } = req;
    let user = await botDb.User.findById(userId);
    if (!user) {
      return next({
        message: { id: 'User not found.' },
        status: errorConfig.status_code.NOT_FOUND
      });
    }
    // user.email = req.body.email
    // Handle with changing name
    let nameChanged = false;
    const oldFirstName = user.first_name;
    const oldLastName = user.last_name;
    if (
      user.first_name !== req.body.first_name ||
      user.last_name !== req.body.last_name
    ) {
      nameChanged = true;
    }
    user.first_name = req.body.first_name;
    user.last_name = req.body.last_name;

    // Handle with changing role
    let roleChanged = false;
    let oldRole = user.role;
    if (user.role.toString() !== req.body.role_id) {
      roleChanged = true;
    }
    user.role = req.body.role_id;

    // Handle with changing status
    let statusChanged = false;
    let oldStatus = user.status;
    if (user.status !== req.body.status) {
      statusChanged = true;
    }
    user.status = req.body.status;

    if (req.body.reset_password) {
      user.recovery_code = uuid.v4();
      let rightNow = new Date();
      user.recovery_expired_at = rightNow.setDate(rightNow.getDate() + 1);
      res.app.emit('UserUpdated', req, res, {
        userId: user._id,
        email: user.email,
        firstName: user.first_name,
        recoveryCode: user.recovery_code
      });
    }

    user = await user.save();

    if (nameChanged) {
      res.app.emit('UserNameChanged', req, res, {
        user: user._id,
        oldFirstName: oldFirstName,
        newFirstName: user.first_name,
        oldLastName: oldLastName,
        newLastName: user.last_name,
        updatedBy: req.user.id
      });
    }

    if (roleChanged) {
      res.app.emit('UserRoleChanged', req, res, {
        user: user._id,
        oldRole: oldRole,
        newRole: user.role,
        updatedBy: req.user.id
      });
    }

    if (statusChanged) {
      res.app.emit('UserStatusChanged', req, res, {
        user: user._id,
        oldStatus: oldStatus,
        newStatus: user.status,
        updatedBy: req.user.id
      });
    }

    user = await botDb.User.populate(user, ['role', 'created_by']);
    user = await serializer(req, user, userSerializer, {
      includePermissions: false
    });
    return res.jsend(user);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};