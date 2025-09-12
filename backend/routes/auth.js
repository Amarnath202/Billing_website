const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('role', 'Role must be either User or Admin').optional().isIn(['User', 'Admin'])
  ],
  authController.login
);

// @route   POST /api/auth/signup
// @desc    Register user & get token
// @access  Public
router.post(
  '/signup',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role must be either User or Admin').optional().isIn(['User', 'Admin'])
  ],
  authController.signup
);

// @route   GET /api/auth/roles
// @desc    Get available roles for signup
// @access  Public
router.get('/roles', async (req, res) => {
  try {
    const Role = require('../models/Role');
    const roles = await Role.find({ status: 'Active' }).select('name');
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;