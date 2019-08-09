const serializer = require('express-serializer');
const permissionSerializer = require('./permission');

module.exports = async (req, role, options) => {
  if (typeof role === 'undefined' || !role) {
    return null;
  }

  options = typeof options !== 'undefined' ? options : {};
  options.includePermissions =
    typeof options.includePermissions !== 'undefined'
      ? options.includePermissions
      : true;
  let item = {
    id: role._id,
    name: role.name,
    created_at: role.createdAt,
    updated_at: role.updatedAt
  };

  if (options.includePermissions) {
    item.permissions = await serializer(
      req,
      role.permissions,
      permissionSerializer,
      { role: role.id }
    );
  }

  return item;
};
