const Role = require('../models/Role');
const { validationResult } = require('express-validator');

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    console.log('Fetching all roles');
    const roles = await Role.find().sort({ createdAt: -1 });
    console.log('Found roles:', roles);
    res.json(roles);
  } catch (err) {
    console.error('Error in getRoles:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Create a new role
exports.createRole = async (req, res) => {
  try {
    console.log('Creating new role with data:', req.body);
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, permissions, status } = req.body;

    // Check if role already exists
    let role = await Role.findOne({ name });
    if (role) {
      console.log('Role already exists:', name);
      return res.status(400).json({ message: 'Role already exists' });
    }

    // Create new role
    role = new Role({
      name,
      permissions,
      status: status || 'Active'
    });

    await role.save();
    console.log('Role created successfully:', role);
    res.json(role);
  } catch (err) {
    console.error('Error in createRole:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    console.log('Updating role:', req.params.id, 'with data:', req.body);
    const { name, status, permissions } = req.body;

    // Build role object
    const roleFields = {};
    if (name) roleFields.name = name;
    if (status) roleFields.status = status;
    if (permissions) roleFields.permissions = permissions;

    let role = await Role.findById(req.params.id);
    if (!role) {
      console.log('Role not found:', req.params.id);
      return res.status(404).json({ message: 'Role not found' });
    }

    role = await Role.findByIdAndUpdate(
      req.params.id,
      { $set: roleFields },
      { new: true, runValidators: true }
    );

    console.log('Role updated successfully:', role);
    res.json(role);
  } catch (err) {
    console.error('Error in updateRole:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Delete a role
exports.deleteRole = async (req, res) => {
  try {
    console.log('Deleting role:', req.params.id);
    const role = await Role.findById(req.params.id);
    if (!role) {
      console.log('Role not found:', req.params.id);
      return res.status(404).json({ message: 'Role not found' });
    }

    await role.deleteOne();
    console.log('Role deleted successfully');
    res.json({ message: 'Role removed' });
  } catch (err) {
    console.error('Error in deleteRole:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    console.log('Fetching role by ID:', req.params.id);
    const role = await Role.findById(req.params.id);
    if (!role) {
      console.log('Role not found:', req.params.id);
      return res.status(404).json({ message: 'Role not found' });
    }
    console.log('Found role:', role);
    res.json(role);
  } catch (err) {
    console.error('Error in getRoleById:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
}; 