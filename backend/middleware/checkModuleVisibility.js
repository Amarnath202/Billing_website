const Role = require('../models/Role');

module.exports = function(moduleName) {
  return async function(req, res, next) {
    try {
      // Get user's role from the request (set by auth middleware)
      const userRole = req.user.role;

      // Find the role in the database
      const role = await Role.findOne({ name: userRole });

      if (!role) {
        return res.status(403).json({ msg: 'Role not found' });
      }

      // Check if the module is visible for this role
      const modulePermission = role.permissions.find(p => p.module === moduleName);
      
      if (!modulePermission || !modulePermission.visible) {
        return res.status(403).json({ msg: 'Access to this module is not allowed' });
      }

      next();
    } catch (err) {
      console.error('Error checking module visibility:', err);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
}; 