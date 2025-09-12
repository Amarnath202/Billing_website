const Brand = require('../models/Brand');
const Product = require('../models/Product');

// Get all brands with their stock information
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new brand
exports.createBrand = async (req, res) => {
  try {
    const brand = new Brand(req.body);
    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update brand information
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a brand
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    // Check if there are any products associated with this brand
    const productsCount = await Product.countDocuments({ brand: brand.name });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete brand with associated products. Please delete or update the products first.' 
      });
    }
    
    await Brand.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get brand stock information
exports.getBrandStock = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const products = await Product.find({ brand: brand.name });
    const stockInfo = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, product) => sum + product.stock, 0),
      products: products.map(product => ({
        productId: product.productId,
        name: product.name,
        stock: product.stock
      }))
    };

    res.status(200).json(stockInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update brand stock information
exports.updateBrandStock = async (req, res) => {
  try {
    const brandName = req.params.name;
    const products = await Product.find({ brand: brandName });
    
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalProducts = products.length;

    const updatedBrand = await Brand.findOneAndUpdate(
      { name: brandName },
      { totalStock, totalProducts },
      { new: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 