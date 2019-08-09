const userSerializer = require('./user');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, changelog, options) => {
  if (typeof changelog === 'undefined' || !changelog) {
    return null;
  }
  const {
    changed_by,
    _id: id,
    type,
    createdAt: date,
    new_value,
    old_value
  } = changelog;
  let item = {
    id,
    type,
    new_value,
    old_value,
    date
  };

  if (typeof changed_by !== 'undefined' && changed_by) {
    item.changed_by = await userSerializer(req, changed_by, {
      includePermissions: false
    });
  } else {
    item.changed_by = null;
  }

  return item;
};
