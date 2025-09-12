const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const roleController = require('../controllers/roleController');

// @route   GET /api/roles
// @desc    Get all roles
// @access  Public (temporarily)
router.get('/', roleController.getRoles);

// @route   POST /api/roles
// @desc    Create a role
// @access  Public (temporarily)
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('permissions', 'Permissions are required').isArray()
  ],
  roleController.createRole
);

// @route   PUT /api/roles/:id
// @desc    Update a role
// @access  Public (temporarily)
router.put('/:id', roleController.updateRole);

// @route   DELETE /api/roles/:id
// @desc    Delete a role
// @access  Public (temporarily)
router.delete('/:id', roleController.deleteRole);

// @route   GET /api/roles/:id
// @desc    Get role by ID
// @access  Public (temporarily)
router.get('/:id', roleController.getRoleById);

module.exports = router; 