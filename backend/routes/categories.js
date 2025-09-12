const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all categories...');
    
    // Update stock counts before returning
    await Category.updateAllStockCounts();
    
    const categories = await Category.find().sort({ name: 1 });
    
    console.log(`Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Update stock counts
    await category.updateStockCounts();
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      message: 'Error fetching category', 
      error: error.message 
    });
  }
});

// POST /api/categories - Create new category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    const category = new Category({
      name: name.trim(),
      description: description?.trim() || ''
    });
    
    const savedCategory = await category.save();
    
    // Update stock counts
    await savedCategory.updateStockCounts();
    
    console.log('Category created:', savedCategory);
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    res.status(500).json({ 
      message: 'Error creating category', 
      error: error.message 
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check if another category with the same name exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const oldName = category.name;
    
    // Update category
    category.name = name.trim();
    category.description = description?.trim() || '';
    
    const updatedCategory = await category.save();
    
    // If name changed, update all products with this category
    if (oldName !== updatedCategory.name) {
      await Product.updateMany(
        { category: oldName },
        { category: updatedCategory.name }
      );
    }
    
    // Update stock counts
    await updatedCategory.updateStockCounts();
    
    console.log('Category updated:', updatedCategory);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    res.status(500).json({ 
      message: 'Error updating category', 
      error: error.message 
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if any products are using this category
    const productsCount = await Product.countDocuments({ category: category.name });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${productsCount} product(s) are using this category.` 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    console.log('Category deleted:', category.name);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      message: 'Error deleting category', 
      error: error.message 
    });
  }
});

// GET /api/categories/:id/stock - Get stock information for category
router.get('/:id/stock', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Get all products in this category
    const products = await Product.find({ category: category.name })
      .select('name stock productPrice')
      .sort({ name: 1 });
    
    // Update category stock counts
    await category.updateStockCounts();
    
    const stockInfo = {
      categoryName: category.name,
      totalProducts: products.length,
      totalStock: products.reduce((total, product) => total + (product.stock || 0), 0),
      products: products.map(product => ({
        name: product.name,
        stock: product.stock || 0,
        price: product.productPrice || 0
      }))
    };
    
    res.json(stockInfo);
  } catch (error) {
    console.error('Error fetching category stock:', error);
    res.status(500).json({ 
      message: 'Error fetching category stock information', 
      error: error.message 
    });
  }
});

// PUT /api/categories/:name/stock - Update stock counts for category by name
router.put('/:name/stock', async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.params.name });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    await category.updateStockCounts();
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category stock:', error);
    res.status(500).json({ 
      message: 'Error updating category stock', 
      error: error.message 
    });
  }
});

module.exports = router;
