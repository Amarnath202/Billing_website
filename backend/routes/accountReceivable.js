const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AccountReceivable = require('../models/AccountReceivable');
const Customer = require('../models/Customer');
const XLSX = require('xlsx');

// Get all account receivables
router.get('/', async (req, res) => {
  try {
    const accountReceivables = await AccountReceivable.find()
      .populate('customer', 'name email phone')
      .sort({ dueDate: 1 })
      .lean(); // Use lean() for better performance

    // Calculate total balance for each account receivable
    const processedReceivables = accountReceivables.map(receivable => ({
      ...receivable,
      balance: parseFloat(receivable.amount || 0) - parseFloat(receivable.amountPaid || 0)
    }));

    res.json(processedReceivables);
  } catch (error) {
    console.error('Error fetching account receivables:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get account receivables by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const accountReceivables = await AccountReceivable.find({ 
      customer: req.params.customerId 
    })
    .populate('customer', 'name email phone')
    .sort({ dueDate: 1 });
    res.json(accountReceivables);
  } catch (error) {
    console.error('Error fetching customer account receivables:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new account receivable
router.post('/', async (req, res) => {
  try {
    console.log('Received create request with data:', req.body);

    // Validate required fields
    const requiredFields = ['customer', 'invoiceNumber', 'description', 'amount', 'dueDate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate customer ID format
    if (!mongoose.Types.ObjectId.isValid(req.body.customer)) {
      console.log('Invalid customer ID format:', req.body.customer);
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }

    // Find customer to get their name
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      console.log('Customer not found with ID:', req.body.customer);
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate amount
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      console.log('Invalid amount:', req.body.amount);
      return res.status(400).json({ message: 'Invalid amount. Amount must be a positive number' });
    }

    // Validate due date
    const dueDate = new Date(req.body.dueDate);
    if (isNaN(dueDate.getTime())) {
      console.log('Invalid due date:', req.body.dueDate);
      return res.status(400).json({ message: 'Invalid due date format' });
    }

    const accountReceivable = new AccountReceivable({
      customer: req.body.customer,
      customerName: customer.name,
      invoiceNumber: req.body.invoiceNumber,
      description: req.body.description,
      amount: amount,
      dueDate: dueDate,
      status: req.body.status || 'Pending'
    });

    console.log('Attempting to save account receivable:', accountReceivable);
    const newAccountReceivable = await accountReceivable.save();
    console.log('Created new account receivable:', newAccountReceivable);

    const populatedReceivable = await AccountReceivable.findById(newAccountReceivable._id)
      .populate('customer', 'name email phone');
    
    res.status(201).json(populatedReceivable);
  } catch (error) {
    console.error('Detailed error creating account receivable:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      body: req.body
    });

    // Check for duplicate invoice number
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }

    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(400).json({ message: error.message });
  }
});

// Update account receivable
router.put('/:id', async (req, res) => {
  try {
    console.log('Received update request with data:', req.body);

    const accountReceivable = await AccountReceivable.findById(req.params.id);
    if (!accountReceivable) {
      return res.status(404).json({ message: 'Account Receivable not found' });
    }

    // If customer is being updated, validate and get new customer info
    if (req.body.customer) {
      if (!mongoose.Types.ObjectId.isValid(req.body.customer)) {
        return res.status(400).json({ message: 'Invalid customer ID format' });
      }

      if (req.body.customer !== accountReceivable.customer.toString()) {
        const customer = await Customer.findById(req.body.customer);
        if (!customer) {
          return res.status(404).json({ message: 'Customer not found' });
        }
        accountReceivable.customer = req.body.customer;
        accountReceivable.customerName = customer.name;
      }
    }

    // Validate amount if provided
    if (req.body.amount !== undefined) {
      const amount = parseFloat(req.body.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount. Amount must be a positive number' });
      }
      accountReceivable.amount = amount;
    }

    // Validate due date if provided
    if (req.body.dueDate) {
      const dueDate = new Date(req.body.dueDate);
      if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid due date format' });
      }
      accountReceivable.dueDate = dueDate;
    }

    // Update other fields
    if (req.body.invoiceNumber) accountReceivable.invoiceNumber = req.body.invoiceNumber;
    if (req.body.description) accountReceivable.description = req.body.description;
    if (req.body.status) accountReceivable.status = req.body.status;

    const updatedAccountReceivable = await accountReceivable.save();
    console.log('Updated account receivable:', updatedAccountReceivable);

    const populatedReceivable = await AccountReceivable.findById(updatedAccountReceivable._id)
      .populate('customer', 'name email phone');

    res.json(populatedReceivable);
  } catch (error) {
    console.error('Error updating account receivable:', error);
    // Check for duplicate invoice number
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete account receivable
router.delete('/:id', async (req, res) => {
  try {
    console.log('Attempting to delete account receivable with ID:', req.params.id);
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid account receivable ID format' });
    }

    // First try to find the document to verify it exists
    const accountReceivable = await AccountReceivable.findById(req.params.id);
    console.log('Found account receivable:', accountReceivable);

    if (!accountReceivable) {
      console.log('Account receivable not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Account Receivable not found' });
    }

    // Document exists, now try to delete it
    const result = await AccountReceivable.findByIdAndDelete(req.params.id);
    console.log('Delete operation result:', result);

    if (!result) {
      console.log('Delete operation failed for ID:', req.params.id);
      return res.status(500).json({ message: 'Failed to delete account receivable' });
    }

    // Document was successfully deleted
    console.log('Successfully deleted account receivable:', result);
    res.json({ 
      message: 'Account Receivable deleted successfully',
      deletedRecord: result
    });
  } catch (error) {
    console.error('Detailed error deleting account receivable:', {
      error: error.message,
      stack: error.stack,
      id: req.params.id
    });
    res.status(500).json({ 
      message: 'Error deleting account receivable',
      error: error.message,
      details: error.stack
    });
  }
});

// Download Excel
router.get('/download/excel', async (req, res) => {
  try {
    const accountReceivables = await AccountReceivable.find()
      .populate('customer', 'name email phone')
      .sort({ date: -1 })
      .lean();

    // Prepare data for Excel with proper calculations
    const excelData = accountReceivables.map(receivable => ({
      'Order ID': receivable.orderId || '',
      'Customer': receivable.customer?.name || '',
      'Date': receivable.date ? new Date(receivable.date).toLocaleDateString() : '',
      'Total Amount': Number(receivable.amount || 0),
      'Amount Paid': Number(receivable.amountPaid || 0),
      'Balance': Number(receivable.amount || 0) - Number(receivable.amountPaid || 0),
      'Status': receivable.status || ''
    }));

    // Add total row at the bottom
    const totals = excelData.reduce((acc, curr) => ({
      'Total Amount': acc['Total Amount'] + curr['Total Amount'],
      'Amount Paid': acc['Amount Paid'] + curr['Amount Paid'],
      'Balance': acc['Balance'] + curr['Balance']
    }), { 'Total Amount': 0, 'Amount Paid': 0, 'Balance': 0 });

    excelData.push({
      'Order ID': '',
      'Customer': '',
      'Date': 'TOTAL',
      'Total Amount': totals['Total Amount'],
      'Amount Paid': totals['Amount Paid'],
      'Balance': totals['Balance'],
      'Status': ''
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: ['Order ID', 'Customer', 'Date', 'Total Amount', 'Amount Paid', 'Balance', 'Status']
    });

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Order ID
      { wch: 20 }, // Customer
      { wch: 12 }, // Date
      { wch: 12 }, // Total Amount
      { wch: 12 }, // Amount Paid
      { wch: 12 }, // Balance
      { wch: 15 }  // Status
    ];
    worksheet['!cols'] = colWidths;

    // Format numbers to show 2 decimal places
    for (let cell in worksheet) {
      if (cell[0] === '!') continue; // Skip special cells
      if (['D', 'E', 'F'].includes(cell[0])) { // Total Amount, Amount Paid, Balance columns
        if (worksheet[cell].v !== 'Total Amount' && 
            worksheet[cell].v !== 'Amount Paid' && 
            worksheet[cell].v !== 'Balance') {
          worksheet[cell].z = '#,##0.00';
        }
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment In');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payment-in.xlsx');
    
    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ message: 'Error generating Excel file' });
  }
});

module.exports = router; 