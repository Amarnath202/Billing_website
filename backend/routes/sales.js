const express = require('express');
const router = express.Router();
const SaleHistory = require('../models/SaleHistory');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');

// Get all sales with optional filtering
router.get('/', async (req, res) => {
  try {
    const { filter, product } = req.query;
    let query = {};

    if (filter) {
      const now = new Date();
      switch (filter) {
        case 'today':
          query.date = {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lt: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          query.date = {
            $gte: startOfWeek,
            $lt: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'month':
          query.date = {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          };
          break;
        case 'year':
          query.date = {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          };
          break;
      }
    }

    if (product) {
      query['items.product'] = product;
    }

    const sales = await SaleHistory.find(query).sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate PDF report
router.get('/pdf', async (req, res) => {
  try {
    const { filter, product } = req.query;
    let query = {};

    if (filter) {
      const now = new Date();
      switch (filter) {
        case 'today':
          query.date = {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lt: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          query.date = {
            $gte: startOfWeek,
            $lt: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'month':
          query.date = {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          };
          break;
        case 'year':
          query.date = {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          };
          break;
      }
    }

    if (product) {
      query['items.product'] = product;
    }

    const sales = await SaleHistory.find(query).sort({ date: -1 });

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-history-${Date.now()}.pdf`);
    
    // Pipe PDF document to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Sales History Report', { align: 'center' });
    doc.moveDown();

    // Add filter information
    doc.fontSize(12).text(`Filter: ${filter || 'All Time'}`, { align: 'left' });
    if (product) {
      doc.text(`Product: ${product}`, { align: 'left' });
    }
    doc.moveDown();

    // Add table headers
    const tableTop = 150;
    doc.fontSize(10);
    doc.text('Bill Number', 50, tableTop);
    doc.text('Date', 200, tableTop);
    doc.text('Products', 300, tableTop);
    doc.text('Total Amount', 450, tableTop);

    let yPosition = tableTop + 20;

    // Add sales data
    sales.forEach((sale) => {
      if (yPosition > 700) { // Start new page if near bottom
        doc.addPage();
        yPosition = 50;
      }

      doc.text(sale.billNumber, 50, yPosition);
      doc.text(new Date(sale.date).toLocaleDateString(), 200, yPosition);
      doc.text(sale.items.map(item => `${item.product}(${item.quantity})`).join(', '), 300, yPosition, {
        width: 150,
        align: 'left'
      });
      doc.text(`₹${sale.totalAmount.toFixed(2)}`, 450, yPosition);

      yPosition += 30;
    });

    // Add total
    doc.moveDown();
    const total = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    doc.fontSize(12).text(`Total Amount: ₹${total.toFixed(2)}`, { align: 'right' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new sale
router.post('/', async (req, res) => {
  try {
    const { billNumber, date, items, totalAmount } = req.body;

    // Validate the bill
    if (!items || items.length === 0) {
      throw new Error('No items in the bill');
    }

    // Update product stock and validate
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }
      
      // Update stock
      product.stock -= item.quantity;
      await product.save();

      // Update item with current product name
      item.product = product.name;
      item.brand = product.brand;
    }

    // Create sale record
    const sale = new SaleHistory({
      billNumber,
      date: new Date(date),
      items,
      totalAmount
    });

    const savedSale = await sale.save();
    res.status(201).json(savedSale);
  } catch (error) {
    console.error('Error processing sale:', error);
    
    // If there was an error, try to restore any stock changes
    if (req.body.items) {
      try {
        for (const item of req.body.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      } catch (restoreError) {
        console.error('Error restoring stock:', restoreError);
      }
    }
    
    res.status(400).json({ message: error.message });
  }
});

// Delete a sale
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the sale exists
    const sale = await SaleHistory.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // If the sale has associated products, update their quantities
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        const product = await Product.findOne({ name: item.product });
        if (product) {
          // Add back the quantity that was sold
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    // Delete the sale
    await SaleHistory.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ 
      message: 'Error deleting sale', 
      error: error.message 
    });
  }
});

// Get sales statistics
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get today's sales
    const todaySales = await SaleHistory.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    // Get this month's sales
    const monthSales = await SaleHistory.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Get total products and out of stock count
    const products = await Product.find();
    const outOfStock = await Product.countDocuments({ stock: 0 });

    // Calculate statistics
    const todayTotal = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const monthTotal = monthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const averageOrderValue = monthSales.length > 0 ? monthTotal / monthSales.length : 0;

    console.log('Today\'s sales:', {
      startOfToday,
      endOfToday,
      salesCount: todaySales.length,
      total: todayTotal
    });

    res.json({
      todaySales: todayTotal,
      todayOrders: todaySales.length,
      monthSales: monthTotal,
      monthOrders: monthSales.length,
      totalProducts: products.length,
      outOfStock,
      averageOrderValue
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get last seven days sales data
router.get('/weekly-stats', async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Get last 7 days including today
    
    // Set time to start of day for sevenDaysAgo and end of day for today
    sevenDaysAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    const sales = await SaleHistory.find({
      date: {
        $gte: sevenDaysAgo,
        $lte: today
      }
    }).sort({ date: 1 });

    // Group sales by date
    const dailySales = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailySales[dateStr] = 0;
    }

    // Calculate total sales for each day
    sales.forEach(sale => {
      const dateStr = sale.date.toISOString().split('T')[0];
      dailySales[dateStr] = (dailySales[dateStr] || 0) + (sale.totalAmount || 0);
    });

    // Convert to array format for the chart
    const chartData = Object.entries(dailySales).map(([date, amount]) => ({
      date: date,
      amount: amount
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get top selling products with detailed stats
router.get('/top-products', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await SaleHistory.find({
      date: { $gte: thirtyDaysAgo }
    });
    
    // Create a map to store product sales data
    const productSales = new Map();

    // Calculate total sales for each product
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (item.product) {
            const currentTotal = productSales.get(item.product) || { 
              quantity: 0, 
              amount: 0,
              transactions: 0
            };
            
            const itemAmount = (item.price || 0) * (item.quantity || 0);
            
            productSales.set(item.product, {
              quantity: currentTotal.quantity + (item.quantity || 0),
              amount: currentTotal.amount + itemAmount,
              transactions: currentTotal.transactions + 1,
              averageOrderValue: (currentTotal.amount + itemAmount) / (currentTotal.transactions + 1)
            });
          }
        });
      }
    });

    // Calculate total sales for percentage calculation
    let totalSales = 0;
    productSales.forEach(data => {
      totalSales += data.amount;
    });

    // Convert map to array and sort by amount
    const topProducts = Array.from(productSales.entries())
      .map(([product, data]) => ({
        name: product,
        value: data.amount,
        quantity: data.quantity,
        transactions: data.transactions,
        averageOrderValue: data.averageOrderValue,
        percentage: ((data.amount / totalSales) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5 products

    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 