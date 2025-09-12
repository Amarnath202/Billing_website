const express = require('express');
const router = express.Router();
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const Product = require('../models/Product');
const SaleHistory = require('../models/SaleHistory');

// Generate barcode for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { format = 'CODE128', width = 2, height = 100 } = req.query;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create canvas
    const canvas = createCanvas(200, 150);
    
    // Generate barcode using product ID or custom barcode
    const barcodeData = product.barcode || productId;
    
    JsBarcode(canvas, barcodeData, {
      format: format,
      width: parseInt(width),
      height: parseInt(height),
      displayValue: true,
      text: `${product.name} - ${product.brand}`,
      fontSize: 12,
      textMargin: 5
    });

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error generating product barcode:', error);
    res.status(500).json({ message: 'Error generating barcode', error: error.message });
  }
});

// Generate barcode for a sale/bill
router.get('/sale/:saleId', async (req, res) => {
  try {
    const { saleId } = req.params;
    const { format = 'CODE128', width = 2, height = 100 } = req.query;

    // Find the sale
    const sale = await SaleHistory.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Create canvas
    const canvas = createCanvas(250, 150);
    
    // Generate barcode using bill number
    JsBarcode(canvas, sale.billNumber, {
      format: format,
      width: parseInt(width),
      height: parseInt(height),
      displayValue: true,
      text: `Bill: ${sale.billNumber}`,
      fontSize: 12,
      textMargin: 5
    });

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error generating sale barcode:', error);
    res.status(500).json({ message: 'Error generating barcode', error: error.message });
  }
});

// Generate custom barcode
router.post('/generate', async (req, res) => {
  try {
    const { 
      data, 
      format = 'CODE128', 
      width = 2, 
      height = 100, 
      displayValue = true,
      text = '',
      fontSize = 12 
    } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Barcode data is required' });
    }

    // Create canvas
    const canvas = createCanvas(300, 150);
    
    // Generate barcode
    JsBarcode(canvas, data, {
      format: format,
      width: parseInt(width),
      height: parseInt(height),
      displayValue: displayValue,
      text: text || data,
      fontSize: parseInt(fontSize),
      textMargin: 5
    });

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error generating custom barcode:', error);
    res.status(500).json({ message: 'Error generating barcode', error: error.message });
  }
});

// Get barcode data for products
router.get('/products', async (req, res) => {
  try {
    const { search, brand, category, warehouse } = req.query;
    let query = {};

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (warehouse) query.warehouse = warehouse;

    const products = await Product.find(query)
      .select('name brand category warehouse price stock barcode')
      .limit(50);

    // Add barcode data for products that don't have one
    const productsWithBarcode = products.map(product => ({
      ...product.toObject(),
      barcodeData: product.barcode || product._id.toString(),
      barcodeUrl: `/api/barcode/product/${product._id}`
    }));

    res.json(productsWithBarcode);
  } catch (error) {
    console.error('Error fetching products for barcode:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get barcode data for sales
router.get('/sales', async (req, res) => {
  try {
    const { search, fromDate, toDate } = req.query;
    let query = {};

    // Build search query
    if (search) {
      query.billNumber = { $regex: search, $options: 'i' };
    }

    if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const sales = await SaleHistory.find(query)
      .select('billNumber date totalAmount items')
      .sort({ date: -1 })
      .limit(50);

    // Add barcode data
    const salesWithBarcode = sales.map(sale => ({
      ...sale.toObject(),
      barcodeData: sale.billNumber,
      barcodeUrl: `/api/barcode/sale/${sale._id}`
    }));

    res.json(salesWithBarcode);
  } catch (error) {
    console.error('Error fetching sales for barcode:', error);
    res.status(500).json({ message: 'Error fetching sales', error: error.message });
  }
});

module.exports = router;
