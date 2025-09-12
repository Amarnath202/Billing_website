const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    unique: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    default: function() {
      // Use productId as default barcode if none is provided
      return this.productId;
    }
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  productPrice: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Product price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative']
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required']
  }
}, {
  timestamps: true
});

// Add middleware to handle validation errors
productSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Product ID must be unique'));
  } else {
    next(error);
  }
});

// Update warehouse counts after saving a product
productSchema.post('save', async function(doc) {
  const Warehouse = mongoose.model('Warehouse');
  await Warehouse.updateCounts(doc.warehouse);
});

// Store the warehouse ID, brand name, and category before removing a product
productSchema.pre('remove', async function(next) {
  this._oldWarehouse = this.warehouse;
  this._oldBrand = this.brand;
  this._oldCategory = this.category;
  next();
});

// Update warehouse counts after removing a product
productSchema.post('remove', async function(doc) {
  const Warehouse = mongoose.model('Warehouse');
  if (this._oldWarehouse) {
    await Warehouse.updateCounts(this._oldWarehouse);
  }
  // Update brand counts
  const Brand = mongoose.model('Brand');
  if (this._oldBrand) {
    await updateBrandCounts(this._oldBrand);
  }
  // Update category counts
  if (this._oldCategory) {
    await updateCategoryCounts(this._oldCategory);
  }
});

// Handle findOneAndDelete and findOneAndUpdate operations
productSchema.pre('findOneAndDelete', async function(next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    this._oldWarehouse = doc.warehouse;
    this._oldBrand = doc.brand;
    this._oldCategory = doc.category;
  }
  next();
});

productSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Warehouse = mongoose.model('Warehouse');
    if (this._oldWarehouse) {
      await Warehouse.updateCounts(this._oldWarehouse);
    }
    // Update brand counts
    if (this._oldBrand) {
      await updateBrandCounts(this._oldBrand);
    }
    // Update category counts
    if (this._oldCategory) {
      await updateCategoryCounts(this._oldCategory);
    }
  }
});

productSchema.pre('findOneAndUpdate', async function(next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    this._oldWarehouse = doc.warehouse;
    this._oldBrand = doc.brand;
  }
  next();
});

productSchema.post('findOneAndUpdate', async function(doc) {
  const Warehouse = mongoose.model('Warehouse');
  if (doc) {
    // Update old warehouse counts if warehouse changed
    if (this._oldWarehouse && this._oldWarehouse.toString() !== doc.warehouse.toString()) {
      await Warehouse.updateCounts(this._oldWarehouse);
    }
    // Update new warehouse counts
    await Warehouse.updateCounts(doc.warehouse);

    // Update brand counts if brand changed
    if (this._oldBrand && this._oldBrand !== doc.brand) {
      await updateBrandCounts(this._oldBrand);
    }
    await updateBrandCounts(doc.brand);
  }
});

// Helper function to update brand counts
async function updateBrandCounts(brandName) {
  const Brand = mongoose.model('Brand');
  const Product = mongoose.model('Product');
  
  // Get all products for this brand
  const products = await Product.find({ brand: brandName });
  
  // Calculate totals
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  
  // Update the brand
  await Brand.findOneAndUpdate(
    { name: brandName },
    { totalProducts, totalStock }
  );
}

// Add post-save middleware to update brand and category counts
productSchema.post('save', async function(doc) {
  await updateBrandCounts(doc.brand);
  await updateCategoryCounts(doc.category);
});

// Helper function to update category counts
async function updateCategoryCounts(categoryName) {
  const Category = mongoose.model('Category');
  const Product = mongoose.model('Product');

  // Get all products for this category
  const products = await Product.find({ category: categoryName });

  // Calculate totals
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  // Update the category
  await Category.findOneAndUpdate(
    { name: categoryName },
    { totalProducts, totalStock },
    { upsert: true } // Create category if it doesn't exist
  );
}

module.exports = mongoose.model('Product', productSchema);