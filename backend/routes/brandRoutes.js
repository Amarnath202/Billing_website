const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

// Debug middleware for brand routes
router.use((req, res, next) => {
  console.log(`Brand route accessed: ${req.method} ${req.url}`);
  next();
});

// Get all brands
router.get('/', brandController.getAllBrands);

// Create a new brand
router.post('/', brandController.createBrand);

// Update brand information
router.put('/:id', brandController.updateBrand);

// Delete a brand
router.delete('/:id', brandController.deleteBrand);

// Get brand stock information
router.get('/:id/stock', brandController.getBrandStock);

// Update brand stock information
router.put('/:name/stock', brandController.updateBrandStock);

module.exports = router; 