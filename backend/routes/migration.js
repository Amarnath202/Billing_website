const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Migration route to add category field to existing products
router.post('/add-category-to-products', async (req, res) => {
  try {
    console.log('Starting migration: Adding category field to existing products...');
    
    // Find all products without a category field
    const productsWithoutCategory = await Product.find({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: '' }
      ]
    });
    
    console.log(`Found ${productsWithoutCategory.length} products without category`);
    
    if (productsWithoutCategory.length === 0) {
      return res.json({ 
        message: 'No products need migration. All products already have categories.',
        updated: 0 
      });
    }
    
    // Create a default "General" category if it doesn't exist
    let defaultCategory = await Category.findOne({ name: 'General' });
    if (!defaultCategory) {
      defaultCategory = new Category({
        name: 'General',
        description: 'Default category for migrated products'
      });
      await defaultCategory.save();
      console.log('Created default "General" category');
    }
    
    // Update all products without category to use "General"
    const updateResult = await Product.updateMany(
      {
        $or: [
          { category: { $exists: false } },
          { category: null },
          { category: '' }
        ]
      },
      { 
        $set: { category: 'General' }
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} products with default category`);
    
    // Update category counts
    const allCategories = await Category.find();
    for (const category of allCategories) {
      const products = await Product.find({ category: category.name });
      const totalProducts = products.length;
      const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);
      
      await Category.findByIdAndUpdate(category._id, {
        totalProducts,
        totalStock
      });
    }
    
    console.log('Migration completed successfully');
    
    res.json({ 
      message: 'Migration completed successfully',
      updated: updateResult.modifiedCount,
      defaultCategory: 'General'
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      message: 'Migration failed', 
      error: error.message 
    });
  }
});

// Route to check products without categories
router.get('/check-products-without-category', async (req, res) => {
  try {
    const productsWithoutCategory = await Product.find({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: '' }
      ]
    }).select('name brand productId');
    
    res.json({
      count: productsWithoutCategory.length,
      products: productsWithoutCategory
    });
  } catch (error) {
    console.error('Error checking products:', error);
    res.status(500).json({ 
      message: 'Error checking products', 
      error: error.message 
    });
  }
});

module.exports = router;
