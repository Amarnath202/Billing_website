const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  totalStock: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
categorySchema.index({ name: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Virtual for products in this category
categorySchema.virtual('products', {
  ref: 'Product',
  localField: 'name',
  foreignField: 'category',
  justOne: false
});

// Method to update stock counts
categorySchema.methods.updateStockCounts = async function() {
  const Product = mongoose.model('Product');
  
  try {
    const products = await Product.find({ category: this.name });
    
    this.totalProducts = products.length;
    this.totalStock = products.reduce((total, product) => total + (product.stock || 0), 0);
    
    await this.save();
    return this;
  } catch (error) {
    console.error('Error updating stock counts:', error);
    throw error;
  }
};

// Static method to update all category stock counts
categorySchema.statics.updateAllStockCounts = async function() {
  const categories = await this.find();
  const Product = mongoose.model('Product');
  
  for (const category of categories) {
    const products = await Product.find({ category: category.name });
    
    category.totalProducts = products.length;
    category.totalStock = products.reduce((total, product) => total + (product.stock || 0), 0);
    
    await category.save();
  }
  
  return categories;
};

// Pre-save middleware to ensure name is properly formatted
categorySchema.pre('save', function(next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
