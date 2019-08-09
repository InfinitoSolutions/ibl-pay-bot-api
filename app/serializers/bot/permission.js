module.exports = async (req, permission, options) => {
  if (typeof permission === 'undefined' || !permission) {
    return null;
  }

  let item = {
    id: permission.id,
    permission: permission.permission,
    objective: permission.objective,
    route_name: permission.route_name,
    created_at: permission.createdAt,
    updated_at: permission.updatedAt
  };
  options = typeof options !== 'undefined' ? options : {};
  if (typeof options.role !== 'undefined') {
    const targetRole = permission.target_roles.find(
      item => item.from.toString() === options.role
    );

    if (targetRole) {
      item.target_roles = targetRole.target;
      if (targetRole.to.length) {
        item.can_change_to_roles = targetRole.to;
      }
    }
  }

  return item;
};
