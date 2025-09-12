const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SalesOrder = require('../models/SalesOrder');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const CashInHandSales = require('../models/CashInHandsa');
const CashInBankSales = require('../models/CashInBanksa');
const CashInChequeSales = require('../models/CashInChequesa');
const AccountReceivable = require('../models/AccountReceivable');

// Get all sales orders
router.get('/', async (req, res) => {
  try {
    const salesOrders = await SalesOrder.find()
      .populate('customer', 'name email phone')
      .populate('product', 'name brand category')
      .populate('warehouse', 'name')
      .sort({ orderDate: -1 });
    res.json(salesOrders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sales order by ID
router.get('/:id', async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('product', 'name brand category')
      .populate('warehouse', 'name');
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }
    res.json(salesOrder);
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new sales order
router.post('/', async (req, res) => {
  try {
    console.log('Received create request with data:', req.body);

    // Validate required fields
    const requiredFields = ['customer', 'product', 'warehouse', 'quantity', 'date', 'dueDate', 'total', 'paymentAmount', 'paymentType'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate customer
    if (!mongoose.Types.ObjectId.isValid(req.body.customer)) {
      console.log('Invalid customer ID:', req.body.customer);
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      console.log('Customer not found:', req.body.customer);
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate product and check stock
    if (!mongoose.Types.ObjectId.isValid(req.body.product)) {
      console.log('Invalid product ID:', req.body.product);
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    const product = await Product.findById(req.body.product);
    if (!product) {
      console.log('Product not found:', req.body.product);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate warehouse
    if (!mongoose.Types.ObjectId.isValid(req.body.warehouse)) {
      console.log('Invalid warehouse ID:', req.body.warehouse);
      return res.status(400).json({ message: 'Invalid warehouse ID format' });
    }
    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      console.log('Warehouse not found:', req.body.warehouse);
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Validate quantity and check stock availability
    const quantity = parseInt(req.body.quantity);
    if (isNaN(quantity) || quantity < 1) {
      console.log('Invalid quantity:', req.body.quantity);
      return res.status(400).json({ message: 'Invalid quantity. Must be a positive number' });
    }

    // Check if enough stock is available
    if (product.stock < quantity) {
      console.log(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
      });
    }

    // Validate total amount
    const total = parseFloat(req.body.total);
    if (isNaN(total) || total <= 0) {
      console.log('Invalid total amount:', req.body.total);
      return res.status(400).json({ message: 'Invalid total amount. Must be a positive number' });
    }

    // Validate payment amount
    const paymentAmount = parseFloat(req.body.paymentAmount);
    if (isNaN(paymentAmount) || paymentAmount < 0) {
      console.log('Invalid payment amount:', req.body.paymentAmount);
      return res.status(400).json({ message: 'Invalid payment amount. Must be a non-negative number' });
    }

    // Validate payment amount doesn't exceed total
    if (paymentAmount > total) {
      console.log(`Payment amount (${paymentAmount}) exceeds total (${total})`);
      return res.status(400).json({ message: 'Payment amount cannot exceed total amount' });
    }

    // Validate dates
    try {
      const date = new Date(req.body.date);
      const dueDate = new Date(req.body.dueDate);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      if (isNaN(dueDate.getTime())) throw new Error('Invalid due date');
      if (dueDate < date) {
        return res.status(400).json({ message: 'Due date cannot be earlier than order date' });
      }
    } catch (error) {
      console.log('Date validation error:', error);
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Create sales order
    const salesOrder = new SalesOrder({
      customer: req.body.customer,
      product: req.body.product,
      warehouse: req.body.warehouse,
      quantity: quantity,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      total: total,
      paymentAmount: paymentAmount,
      paymentType: req.body.paymentType,
      accountNumber: req.body.paymentType === 'Bank' ? req.body.accountNumber : '',
      paymentNote: req.body.paymentNote || '',
      status: paymentAmount >= total ? 'Completed' : 'Pending'
    });

    // Validate bank payment details
    if (req.body.paymentType === 'Bank') {
      if (!req.body.accountNumber?.trim()) {
        return res.status(400).json({ message: 'Account number is required for bank payments' });
      }
    }

    console.log('Creating sales order:', salesOrder);
    const newSalesOrder = await salesOrder.save();
    console.log('Sales order created:', newSalesOrder);

    // Update product stock
    try {
      product.stock -= quantity;
      await product.save();
      console.log('Product stock updated');
    } catch (stockError) {
      console.error('Error updating product stock:', stockError);
      // If updating stock fails, delete the sales order
      await SalesOrder.findByIdAndDelete(newSalesOrder._id);
      throw new Error('Failed to update product stock');
    }

    // Create corresponding cash entry based on payment type
    const cashData = {
      orderId: newSalesOrder.orderNumber,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      customer: customer.name,
      product: product.name,
      quantity: quantity,
      totalAmount: total,
      amountPaid: paymentAmount,
      paymentType: req.body.paymentType,
      paymentNote: req.body.paymentNote || '',
      transactionId: `${newSalesOrder.orderNumber}-${Date.now()}`
    };

    try {
      if (req.body.paymentType === 'Bank') {
        cashData.accountNumber = req.body.accountNumber.trim();
        const bankEntry = await new CashInBankSales(cashData).save();
        console.log('Bank entry created:', bankEntry);
      } else if (req.body.paymentType === 'Cash') {
        const cashEntry = await new CashInHandSales(cashData).save();
        console.log('Cash entry created:', cashEntry);
      } else if (req.body.paymentType === 'Cheque') {
        const chequeEntry = await new CashInChequeSales(cashData).save();
        console.log('Cheque entry created:', chequeEntry);
      }

      // Create account receivable entry
      const accountReceivable = new AccountReceivable({
        orderId: newSalesOrder.orderNumber,
        invoiceNumber: newSalesOrder.orderNumber,
        date: new Date(req.body.date),
        customer: req.body.customer,
        customerName: customer.name,
        amount: parseFloat(total),
        amountPaid: parseFloat(paymentAmount),
        status: paymentAmount >= total ? 'Received' : paymentAmount > 0 ? 'Partially Paid' : 'Pending'
      });

      const savedReceivable = await accountReceivable.save();
      console.log('Account receivable created:', savedReceivable);

      const populatedOrder = await SalesOrder.findById(newSalesOrder._id)
        .populate('customer', 'name email phone')
        .populate('product', 'name brand category')
        .populate('warehouse', 'name');

      res.status(201).json(populatedOrder);
    } catch (error) {
      console.error('Error creating cash entry or account receivable:', error);
      // If cash entry or account receivable fails, restore product stock and delete the sales order
      product.stock += quantity;
      await product.save();
      await SalesOrder.findByIdAndDelete(newSalesOrder._id);
      throw error;
    }
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update sales order
router.put('/:id', async (req, res) => {
  try {
    console.log('Update sales order request:', {
      id: req.params.id,
      body: req.body
    });

    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      console.log('Sales order not found:', req.params.id);
      return res.status(404).json({ message: 'Sales order not found' });
    }

    console.log('Found sales order:', salesOrder);

    // Store original values for stock adjustment
    const originalQuantity = salesOrder.quantity;
    const originalProduct = await Product.findById(salesOrder.product);
    if (!originalProduct) {
      return res.status(404).json({ message: 'Original product not found' });
    }

    // Get customer for cash entry update
    const customer = await Customer.findById(salesOrder.customer);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get product for cash entry update
    const product = await Product.findById(salesOrder.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update sales order fields
    if (req.body.customer) salesOrder.customer = req.body.customer;
    if (req.body.product) salesOrder.product = req.body.product;
    if (req.body.warehouse) salesOrder.warehouse = req.body.warehouse;
    if (req.body.quantity) salesOrder.quantity = parseInt(req.body.quantity);
    if (req.body.date) salesOrder.date = new Date(req.body.date);
    if (req.body.dueDate) salesOrder.dueDate = new Date(req.body.dueDate);
    if (req.body.total) salesOrder.total = parseFloat(req.body.total);
    if (req.body.paymentAmount !== undefined) salesOrder.paymentAmount = parseFloat(req.body.paymentAmount);
    if (req.body.paymentType) salesOrder.paymentType = req.body.paymentType;
    if (req.body.paymentNote !== undefined) salesOrder.paymentNote = req.body.paymentNote;
    if (req.body.status) salesOrder.status = req.body.status;

    // Update corresponding cash entry
    try {
      let cashEntry;
      const cashData = {
        orderId: salesOrder.orderNumber,
        date: salesOrder.date,
        dueDate: salesOrder.dueDate,
        customer: customer.name,
        product: product.name,
        quantity: salesOrder.quantity,
        totalAmount: salesOrder.total,
        amountPaid: salesOrder.paymentAmount,
        paymentType: salesOrder.paymentType,
        paymentNote: salesOrder.paymentNote || ''
      };

      // Handle cash entry updates based on payment type
      if (salesOrder.paymentType === 'Bank') {
        // Delete any existing cash or cheque entries
        await CashInHandSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
        await CashInChequeSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
        
        // Update or create bank entry
        cashEntry = await CashInBankSales.findOneAndUpdate(
          { orderId: salesOrder.orderNumber },
          cashData,
          { upsert: true, new: true }
        );
        console.log('Bank entry updated:', cashEntry);
      } else if (salesOrder.paymentType === 'Cash') {
        // Delete any existing bank or cheque entries
        await CashInBankSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
        await CashInChequeSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
        
        // Update or create cash entry
        cashEntry = await CashInHandSales.findOneAndUpdate(
          { orderId: salesOrder.orderNumber },
          cashData,
          { upsert: true, new: true }
        );
        console.log('Cash entry updated:', cashEntry);
      } else if (salesOrder.paymentType === 'Cheque') {
        // Delete any existing cash or bank entries
        await CashInHandSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
        await CashInBankSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
        
        // Update or create cheque entry
        cashEntry = await CashInChequeSales.findOneAndUpdate(
          { orderId: salesOrder.orderNumber },
          cashData,
          { upsert: true, new: true }
        );
        console.log('Cheque entry updated:', cashEntry);
      }

      // Update account receivable
      const accountReceivable = await AccountReceivable.findOne({ orderId: salesOrder.orderNumber });
      if (accountReceivable) {
        accountReceivable.amount = parseFloat(salesOrder.total);
        accountReceivable.amountPaid = parseFloat(salesOrder.paymentAmount);
        accountReceivable.status = salesOrder.paymentAmount >= salesOrder.total ? 'Received' : 
                                 salesOrder.paymentAmount > 0 ? 'Partially Paid' : 'Pending';
        await accountReceivable.save();
        console.log('Account receivable updated:', accountReceivable);
      }
    } catch (error) {
      console.error('Error updating cash entry or account receivable:', error);
      throw error;
    }

    const updatedSalesOrder = await salesOrder.save();
    console.log('Sales order updated successfully:', updatedSalesOrder);

    const populatedOrder = await SalesOrder.findById(updatedSalesOrder._id)
      .populate('customer', 'name email phone')
      .populate('product', 'name brand category')
      .populate('warehouse', 'name');

    res.json(populatedOrder);
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete sales order
router.delete('/:id', async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // Get the product to restore stock
    const product = await Product.findById(salesOrder.product);
    if (product) {
      try {
        // Restore the stock
        product.stock += salesOrder.quantity;
        await product.save();
      } catch (stockError) {
        console.error('Error restoring product stock:', stockError);
        // Continue with deletion even if stock update fails
      }
    }

    // Delete corresponding cash entries
    try {
      if (salesOrder.paymentType === 'Cash') {
        await CashInHandSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
      } else if (salesOrder.paymentType === 'Bank') {
        await CashInBankSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
      } else if (salesOrder.paymentType === 'Cheque') {
        await CashInChequeSales.findOneAndDelete({ orderId: salesOrder.orderNumber });
      }

      // Delete corresponding account receivable entry
      await AccountReceivable.findOneAndDelete({ invoiceNumber: salesOrder.orderNumber });
    } catch (error) {
      console.error('Error deleting cash entry or account receivable:', error);
      // Continue with sales order deletion even if cash entry deletion fails
    }

    await salesOrder.deleteOne();
    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 