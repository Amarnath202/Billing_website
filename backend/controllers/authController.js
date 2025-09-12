const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// @desc    Login user & get token
// @access  Public
exports.login = async (req, res) => {
  console.log('Login attempt:', { email: req.body.email });
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role: requestedRole } = req.body;

    // Check if user exists and populate role
    const user = await User.findOne({ email }).select('+password');
    console.log('User search result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('User found:', { 
      id: user._id,
      email: user.email,
      status: user.status 
    });

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      console.log('User inactive:', user.status);
      return res.status(400).json({ msg: 'Account is inactive' });
    }

    // Get role details
    const role = await Role.findById(user.role);
    console.log('Role lookup result:', role ? 'Found' : 'Not found');
    
    if (!role) {
      console.log('Role not found for user:', user._id);
      return res.status(500).json({ msg: 'Role configuration error' });
    }

    // Check if requested role matches user's actual role (if role is specified)
    if (requestedRole && role.name !== requestedRole) {
      console.log('Role mismatch:', { userRole: role.name, requestedRole });
      return res.status(403).json({
        msg: `Access denied. You don't have ${requestedRole} privileges. Your role is ${role.name}.`
      });
    }

    // Create and sign JWT token
    const payload = {
      user: {
        id: user._id,
        role: {
          id: role._id,
          name: role.name,
          permissions: role.permissions || []
        }
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Token signing error:', err);
          return res.status(500).json({ msg: 'Error generating authentication token' });
        }
        console.log('Login successful:', { userId: user._id });
        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: {
              id: role._id,
              name: role.name,
              permissions: role.permissions || []
            },
            status: user.status
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in login:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @desc    Register user & get token
// @access  Public
exports.signup = async (req, res) => {
  console.log('Signup attempt:', { email: req.body.email, name: req.body.name });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    // Generate username from email
    const username = email.split('@')[0];

    // Get role from request or default to 'User'
    const { role: requestedRole } = req.body;
    let selectedRole;

    if (requestedRole) {
      selectedRole = await Role.findOne({ name: requestedRole });
      if (!selectedRole) {
        return res.status(400).json({ msg: 'Invalid role specified' });
      }
    } else {
      // Get default user role
      selectedRole = await Role.findOne({ name: 'User' });
      if (!selectedRole) {
        // Create a default user role if it doesn't exist
        selectedRole = new Role({
          name: 'User',
          status: 'Active',
          permissions: [
            { module: 'Dashboard', visible: true },
            { module: 'Profile', visible: true }
          ]
        });
        await selectedRole.save();
        console.log('Created default User role');
      }
    }

    // Ensure Admin role exists with full permissions
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      const allModules = [
        'Dashboard', 'Users', 'Roles', 'Products', 'Sales', 'Purchases',
        'Customers', 'Suppliers', 'Inventory', 'Reports', 'Settings',
        'Billing', 'Payments', 'Expenses', 'Categories', 'Brands',
        'Warehouses', 'Email', 'Account Payable', 'Account Receivable'
      ];

      adminRole = new Role({
        name: 'Admin',
        status: 'Active',
        permissions: allModules.map(module => ({
          module,
          visible: true
        }))
      });
      await adminRole.save();
      console.log('Created Admin role with full permissions');
    }

    // Create new user
    user = new User({
      username,
      firstName,
      lastName,
      email,
      password,
      role: selectedRole._id,
      status: 'Active'
    });

    await user.save();
    console.log('User created successfully:', { id: user._id, email: user.email });

    // Create JWT payload
    const payload = {
      user: {
        id: user._id,
        email: user.email,
        role: selectedRole._id
      }
    };

    // Sign token and return
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Token signing error:', err);
          throw err;
        }
        console.log('Signup successful:', { userId: user._id });
        res.status(201).json({
          token,
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: {
              id: selectedRole._id,
              name: selectedRole.name,
              permissions: selectedRole.permissions || []
            },
            status: user.status
          },
          msg: 'User registered successfully'
        });
      }
    );
  } catch (err) {
    console.error('Error in signup:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};