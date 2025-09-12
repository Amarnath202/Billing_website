const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  stockCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Method to update warehouse counts
warehouseSchema.statics.updateCounts = async function(warehouseId) {
  const Product = mongoose.model('Product');
  
  // Get all products in this warehouse
  const products = await Product.find({ warehouse: warehouseId });
  
  // Calculate totals
  const totalProducts = products.length;
  const stockCount = products.reduce((sum, product) => sum + product.stock, 0);
  
  // Update the warehouse
  await this.findByIdAndUpdate(warehouseId, {
    totalProducts,
    stockCount
  });
};

module.exports = mongoose.model('Warehouse', warehouseSchema); 