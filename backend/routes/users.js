const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check } = require('express-validator');
const userController = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, userController.getUsers);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail()
    ]
  ],
  userController.updateProfile
);

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    auth,
    [
      check('currentPassword', 'Current password is required').not().isEmpty(),
      check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ]
  ],
  userController.changePassword
);

// @route   POST /api/users
// @desc    Create a new user
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Role is required').not().isEmpty(),
      check('status', 'Status must be either Active or Inactive').isIn(['Active', 'Inactive'])
    ]
  ],
  userController.createUser
);

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('firstName', 'First name is required').optional().not().isEmpty(),
      check('lastName', 'Last name is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('role', 'Role is required').optional().not().isEmpty(),
      check('status', 'Status must be either Active or Inactive').optional().isIn(['Active', 'Inactive'])
    ]
  ],
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private
router.delete('/:id', auth, userController.deleteUser);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, userController.getUserById);

module.exports = router; 