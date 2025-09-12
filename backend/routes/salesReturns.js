const express = require('express');
const router = express.Router();
const SalesReturn = require('../models/SalesReturn');
const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// Get all sales returns
router.get('/', async (req, res) => {
  try {
    const returns = await SalesReturn.find()
      .populate('customer')
      .populate('product')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    console.error('Error fetching sales returns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sales return by ID
router.get('/:id', async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.id)
      .populate('customer')
      .populate('product');
    if (!salesReturn) {
      return res.status(404).json({ message: 'Sales return not found' });
    }
    res.json(salesReturn);
  } catch (error) {
    console.error('Error fetching sales return:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new sales return
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      date,
      dueDate,
      customer,
      customerName,
      product,
      quantity,
      total,
      paymentAmount,
      paymentType,
      reason
    } = req.body;

    // Validate that the original sales order exists
    const originalSale = await SalesOrder.findOne({ orderNumber: orderId });
    if (!originalSale) {
      return res.status(400).json({ message: 'Original sales order not found' });
    }

    // Validate return quantity doesn't exceed original sales quantity
    if (quantity > originalSale.quantity) {
      return res.status(400).json({ 
        message: 'Return quantity cannot exceed original sales quantity' 
      });
    }

    const salesReturn = new SalesReturn({
      orderId,
      date: new Date(date),
      dueDate: new Date(dueDate),
      customer: originalSale.customer,
      customerName,
      product,
      quantity: parseInt(quantity),
      total: parseFloat(total),
      paymentAmount: parseFloat(paymentAmount || 0),
      paymentType,
      reason
    });

    const newSalesReturn = await salesReturn.save();
    await newSalesReturn.populate(['customer', 'product']);
    
    // Update product stock
    const productToUpdate = await Product.findById(product);
    if (productToUpdate) {
      productToUpdate.stock += parseInt(quantity);
      await productToUpdate.save();
    }

    res.status(201).json(newSalesReturn);
  } catch (error) {
    console.error('Error creating sales return:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update sales return
router.put('/:id', async (req, res) => {
  try {
    const {
      orderId,
      date,
      dueDate,
      customer,
      customerName,
      product,
      quantity,
      total,
      paymentAmount,
      paymentType,
      reason,
      status
    } = req.body;

    const salesReturn = await SalesReturn.findById(req.params.id);
    if (!salesReturn) {
      return res.status(404).json({ message: 'Sales return not found' });
    }

    // If quantity is being updated, adjust product stock
    if (quantity && quantity !== salesReturn.quantity) {
      const productToUpdate = await Product.findById(salesReturn.product);
      if (productToUpdate) {
        // Remove the old quantity and add the new quantity
        productToUpdate.stock = productToUpdate.stock - salesReturn.quantity + parseInt(quantity);
        await productToUpdate.save();
      }
    }

    // Update fields
    if (orderId) salesReturn.orderId = orderId;
    if (date) salesReturn.date = new Date(date);
    if (dueDate) salesReturn.dueDate = new Date(dueDate);
    if (customer) salesReturn.customer = customer;
    if (customerName) salesReturn.customerName = customerName;
    if (product) salesReturn.product = product;
    if (quantity) salesReturn.quantity = parseInt(quantity);
    if (total) salesReturn.total = parseFloat(total);
    if (paymentAmount !== undefined) salesReturn.paymentAmount = parseFloat(paymentAmount);
    if (paymentType) salesReturn.paymentType = paymentType;
    if (reason) salesReturn.reason = reason;
    if (status) salesReturn.status = status;

    const updatedSalesReturn = await salesReturn.save();
    await updatedSalesReturn.populate(['customer', 'product']);
    
    res.json(updatedSalesReturn);
  } catch (error) {
    console.error('Error updating sales return:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete sales return
router.delete('/:id', async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.id);
    if (!salesReturn) {
      return res.status(404).json({ message: 'Sales return not found' });
    }

    if (salesReturn.status === 'Completed' || salesReturn.status === 'Paid') {
      return res.status(400).json({ 
        message: 'Cannot delete a completed or paid sales return' 
      });
    }

    // Revert product stock
    const product = await Product.findById(salesReturn.product);
    if (product) {
      product.stock -= salesReturn.quantity;
      await product.save();
    }

    await SalesReturn.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sales return deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales return:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download PDF
router.get('/download/pdf', async (req, res) => {
  try {
    const returns = await SalesReturn.find()
      .populate('customer', 'name email phone')
      .populate('product', 'name brand')
      .sort({ date: -1 })
      .lean();

    // Create PDF document
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-returns.pdf');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Sales Returns Report', { align: 'center' });
    doc.moveDown();

    // Add generation date
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Add table headers
    doc.fontSize(10);
    const startY = doc.y;
    doc.text('Return ID', 50, startY, { width: 80 });
    doc.text('Order ID', 130, startY, { width: 80 });
    doc.text('Date', 210, startY, { width: 60 });
    doc.text('Customer', 270, startY, { width: 100 });
    doc.text('Product', 370, startY, { width: 80 });
    doc.text('Quantity', 450, startY, { width: 50 });
    doc.text('Total', 500, startY, { width: 60 });

    doc.moveDown();

    // Add data rows
    let totalAmount = 0;
    returns.forEach((returnItem, index) => {
      const y = doc.y;
      doc.text(returnItem.returnId || '-', 50, y, { width: 80 });
      doc.text(returnItem.orderId || '-', 130, y, { width: 80 });
      doc.text(new Date(returnItem.date).toLocaleDateString(), 210, y, { width: 60 });
      doc.text(returnItem.customer?.name || '-', 270, y, { width: 100 });
      doc.text(returnItem.product?.name || '-', 370, y, { width: 80 });
      doc.text(returnItem.quantity?.toString() || '0', 450, y, { width: 50 });
      doc.text(`₹${returnItem.total?.toFixed(2) || '0.00'}`, 500, y, { width: 60 });

      totalAmount += returnItem.total || 0;
      doc.moveDown();

      // Add new page if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });

    // Add total
    doc.moveDown();
    doc.fontSize(12).text(`Total Amount: ₹${totalAmount.toFixed(2)}`, { align: 'right' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download Excel
router.get('/download/excel', async (req, res) => {
  try {
    const returns = await SalesReturn.find()
      .populate('customer', 'name email phone')
      .populate('product', 'name brand')
      .sort({ date: -1 })
      .lean();

    // Prepare data for Excel
    const excelData = returns.map(returnItem => ({
      'Return ID': returnItem.returnId || '',
      'Order ID': returnItem.orderId || '',
      'Date': returnItem.date ? new Date(returnItem.date).toLocaleDateString() : '',
      'Due Date': returnItem.dueDate ? new Date(returnItem.dueDate).toLocaleDateString() : '',
      'Customer': returnItem.customer?.name || '',
      'Customer Email': returnItem.customer?.email || '',
      'Customer Phone': returnItem.customer?.phone || '',
      'Product': returnItem.product?.name || '',
      'Product Brand': returnItem.product?.brand || '',
      'Quantity': returnItem.quantity || 0,
      'Total Amount': returnItem.total || 0,
      'Payment Amount': returnItem.paymentAmount || 0,
      'Payment Type': returnItem.paymentType || '',
      'Reason': returnItem.reason || '',
      'Status': returnItem.status || 'Pending'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Return ID
      { wch: 15 }, // Order ID
      { wch: 12 }, // Date
      { wch: 12 }, // Due Date
      { wch: 20 }, // Customer
      { wch: 25 }, // Customer Email
      { wch: 15 }, // Customer Phone
      { wch: 20 }, // Product
      { wch: 15 }, // Product Brand
      { wch: 10 }, // Quantity
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Payment Amount
      { wch: 12 }, // Payment Type
      { wch: 30 }, // Reason
      { wch: 12 }  // Status
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Returns');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-returns.xlsx');

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;