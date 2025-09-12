const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');

// Helper function to update brand counts
async function updateBrandCounts(brandName) {
  if (!brandName) return;

  try {
    // Get all products for this brand
    const products = await Product.find({ brand: brandName });

    // Calculate totals
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);

    if (totalProducts === 0) {
      // If no products left, delete the brand
      await Brand.findOneAndDelete({ name: brandName });
      console.log(`Brand '${brandName}' deleted - no products remaining`);
    } else {
      // Update the brand with new counts
      await Brand.findOneAndUpdate(
        { name: brandName },
        { totalProducts, totalStock },
        { upsert: true } // Create brand if it doesn't exist
      );
      console.log(`Brand '${brandName}' updated - ${totalProducts} products, ${totalStock} total stock`);
    }
  } catch (error) {
    console.error('Error updating brand counts:', error);
  }
}

// Helper function to update category counts
async function updateCategoryCounts(categoryName) {
  if (!categoryName) return;

  try {
    // Get all products for this category
    const products = await Product.find({ category: categoryName });

    // Calculate totals
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);

    if (totalProducts === 0) {
      // If no products left, delete the category
      await Category.findOneAndDelete({ name: categoryName });
      console.log(`Category '${categoryName}' deleted - no products remaining`);
    } else {
      // Update the category with new counts
      await Category.findOneAndUpdate(
        { name: categoryName },
        { totalProducts, totalStock },
        { upsert: true } // Create category if it doesn't exist
      );
      console.log(`Category '${categoryName}' updated - ${totalProducts} products, ${totalStock} total stock`);
    }
  } catch (error) {
    console.error('Error updating category counts:', error);
  }
}

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all products with warehouse data...');
    const products = await Product.find().populate('warehouse', 'name');
    console.log('Products fetched:', products);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get products by warehouse ID
router.get('/warehouse/:warehouseId', async (req, res) => {
  try {
    console.log('Fetching products for warehouse:', req.params.warehouseId);
    const products = await Product.find({ warehouse: req.params.warehouseId })
      .populate('warehouse', 'name');
    console.log('Products fetched for warehouse:', products);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by warehouse:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    console.log('Received product data:', req.body);

    // Validate required fields
    const requiredFields = ['productId', 'name', 'brand', 'category', 'description', 'productPrice', 'stock', 'warehouse'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate and convert numeric fields
    const numericFields = ['productPrice', 'stock'];
    const invalidFields = numericFields.filter(field => {
      const value = Number(req.body[field]);
      return isNaN(value) || (field !== 'stock' && value <= 0) || (field === 'stock' && value < 0);
    });

    if (invalidFields.length > 0) {
      console.log('Invalid numeric fields:', invalidFields);
      return res.status(400).json({
        message: `Invalid values for: ${invalidFields.join(', ')}`
      });
    }

    // Create new product instance
    const productData = {
      ...req.body,
      productPrice: Number(req.body.productPrice),
      stock: Number(req.body.stock)
    };

    console.log('Creating product with data:', productData);

    const product = new Product(productData);
    const newProduct = await product.save();

    // Update brand and category counts
    await updateBrandCounts(newProduct.brand);
    await updateCategoryCounts(newProduct.category);

    const populatedProduct = await Product.findById(newProduct._id).populate('warehouse', 'name');

    console.log('Product created successfully:', populatedProduct);
    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('Error creating product:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Product ID already exists' 
      });
    }

    res.status(400).json({ message: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating product. ID:', req.params.id, 'Data:', req.body);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Store old values for count updates
    const oldBrand = product.brand;
    const oldCategory = product.category;

    // Update fields if provided
    const updateFields = ['productId', 'name', 'brand', 'category', 'description', 'productPrice', 'stock', 'warehouse'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = field === 'productPrice' || field === 'stock'
          ? Number(req.body[field])
          : req.body[field];
      }
    });

    console.log('Saving updated product:', product);
    const updatedProduct = await product.save();

    // Update brand counts if brand changed
    if (oldBrand !== updatedProduct.brand) {
      console.log(`Brand changed from '${oldBrand}' to '${updatedProduct.brand}'`);
      await updateBrandCounts(oldBrand); // Update old brand (may delete if no products left)
      await updateBrandCounts(updatedProduct.brand); // Update new brand
    }

    // Update category counts if category changed
    if (oldCategory !== updatedProduct.category) {
      console.log(`Category changed from '${oldCategory}' to '${updatedProduct.category}'`);
      await updateCategoryCounts(oldCategory); // Update old category (may delete if no products left)
      await updateCategoryCounts(updatedProduct.category); // Update new category
    }

    const populatedProduct = await Product.findById(updatedProduct._id).populate('warehouse', 'name');
    console.log('Product updated successfully:', populatedProduct);
    res.json(populatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Product ID already exists' 
      });
    }

    res.status(400).json({ 
      message: error.message || 'Error updating product',
      error: error.toString()
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    // First find the product to get its brand and category
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Store brand and category for count updates
    const brandName = product.brand;
    const categoryName = product.category;

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    console.log(`Product '${product.name}' deleted. Updating brand '${brandName}' and category '${categoryName}' counts...`);

    // Update brand and category counts (may delete brand/category if no products left)
    await updateBrandCounts(brandName);
    await updateCategoryCounts(categoryName);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Utility route to clean up orphaned brands and categories
router.post('/cleanup-brands-categories', async (req, res) => {
  try {
    console.log('Starting cleanup of orphaned brands and categories...');

    // Get all unique brands and categories from products
    const products = await Product.find({}, 'brand category');
    const activeBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const activeCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

    console.log('Active brands:', activeBrands);
    console.log('Active categories:', activeCategories);

    // Remove brands that don't have any products
    const orphanedBrands = await Brand.find({ name: { $nin: activeBrands } });
    if (orphanedBrands.length > 0) {
      await Brand.deleteMany({ name: { $nin: activeBrands } });
      console.log(`Deleted ${orphanedBrands.length} orphaned brands:`, orphanedBrands.map(b => b.name));
    }

    // Remove categories that don't have any products
    const orphanedCategories = await Category.find({ name: { $nin: activeCategories } });
    if (orphanedCategories.length > 0) {
      await Category.deleteMany({ name: { $nin: activeCategories } });
      console.log(`Deleted ${orphanedCategories.length} orphaned categories:`, orphanedCategories.map(c => c.name));
    }

    // Update counts for all active brands and categories
    for (const brandName of activeBrands) {
      await updateBrandCounts(brandName);
    }

    for (const categoryName of activeCategories) {
      await updateCategoryCounts(categoryName);
    }

    res.json({
      message: 'Cleanup completed successfully',
      deletedBrands: orphanedBrands.length,
      deletedCategories: orphanedCategories.length,
      updatedBrands: activeBrands.length,
      updatedCategories: activeCategories.length
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search products by barcode
router.get('/search/barcode/:barcode', async (req, res) => {
  try {
    const searchValue = req.params.barcode.trim();
    console.log('Searching for product with barcode:', searchValue);

    const product = await Product.findOne({
      $or: [
        { productId: searchValue },
        { barcode: searchValue }
      ]
    }).populate('warehouse', 'name');

    if (!product) {
      console.log('No product found with barcode:', searchValue);
      return res.status(404).json({
        message: 'No product found with this barcode',
        searchValue
      });
    }

    console.log('Found product:', product);
    res.json(product);
  } catch (error) {
    console.error('Error searching product by barcode:', error);
    res.status(500).json({
      message: 'Error searching for product',
      error: error.message
    });
  }
});

// Search products by query
router.get('/search', async (req, res) => {
  try {
    const { q, barcode } = req.query;
    let query = {};

    if (barcode) {
      // If barcode is provided, search by barcode or productId
      query = {
        $or: [
          { barcode: barcode },
          { productId: barcode }
        ]
      };
    } else if (q) {
      // If search query is provided, search by name, description, or barcode
      query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { barcode: { $regex: q, $options: 'i' } },
          { productId: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const products = await Product.find(query)
      .populate('warehouse', 'name')
      .limit(10);

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search product by barcode or productId
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const searchValue = req.params.barcode.trim();
    console.log('Searching product by barcode/productId:', searchValue);
    
    // Try to find the product by barcode, productId, or _id
    const product = await Product.findOne({
      $or: [
        { _id: searchValue },
        { productId: searchValue },
        { barcode: searchValue }
      ]
    }).populate('warehouse', 'name');

    if (!product) {
      console.log('No product found for barcode/productId:', searchValue);
      // Try a more flexible search
      const flexProduct = await Product.findOne({
        $or: [
          { productId: { $regex: searchValue, $options: 'i' } },
          { barcode: { $regex: searchValue, $options: 'i' } }
        ]
      }).populate('warehouse', 'name');

      if (!flexProduct) {
        return res.status(404).json({ 
          message: 'No product found with this barcode/ID',
          searchValue 
        });
      }
      return res.json(flexProduct);
    }

    console.log('Product found:', product);
    res.json(product);
  } catch (error) {
    console.error('Error searching product by barcode:', error);
    res.status(500).json({ 
      message: 'Error searching for product',
      error: error.message 
    });
  }
});

module.exports = router;