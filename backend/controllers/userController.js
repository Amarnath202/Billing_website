const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('role', 'name')  // Populate the role reference with just the name field
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error in getUsers:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, mobile, role, status } = req.body;

  try {
    // Generate username from email
    const username = email.split('@')[0];

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create new user
    user = new User({
      username,
      firstName,
      lastName,
      email,
      password,
      mobile,
      role,
      status
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (err) {
    console.error('Error in createUser:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, mobile, role, status } = req.body;

    // Build user object
    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (email) {
      userFields.email = email;
      userFields.username = email.split('@')[0];
    }
    if (mobile) userFields.mobile = mobile;
    if (role) userFields.role = role;
    if (status) userFields.status = status;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Error in updateUser:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // First find the user without population to ensure it exists
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the role details
    const Role = require('../models/Role');
    const roleDetails = await Role.findById(user.role).select('name permissions');

    if (!roleDetails) {
      // If no role found, return user with empty permissions
      const userResponse = user.toObject();
      userResponse.role = {
        name: 'No Role',
        permissions: []
      };
      return res.json(userResponse);
    }

    // Add role details to the user object
    const userResponse = user.toObject();
    userResponse.role = {
      name: roleDetails.name,
      permissions: roleDetails.permissions || []
    };

    res.json(userResponse);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, mobile } = req.body;

    // Build profile object
    const profileFields = {};
    if (firstName) profileFields.firstName = firstName;
    if (lastName) profileFields.lastName = lastName;
    if (email) profileFields.email = email;
    if (mobile) profileFields.mobile = mobile;

    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Error in updateProfile:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password using findOneAndUpdate to avoid validation issues
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { password: hashedPassword } },
      { 
        new: true,
        runValidators: false // Disable validation since we're only updating password
      }
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error in changePassword:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
}; 