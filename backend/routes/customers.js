const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  const customer = new Customer({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address
  });

  try {
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    console.log('Received customer update request for ID:', req.params.id);
    console.log('Update data:', req.body);

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      console.log('Customer not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Customer not found' });
    }

    console.log('Found customer:', customer);

    // Check if email is being changed and if it's already in use
    if (req.body.email && req.body.email !== customer.email) {
      const emailExists = await Customer.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id } // Exclude current customer
      });
      if (emailExists) {
        console.log('Email already exists:', req.body.email);
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update fields
    customer.name = req.body.name?.trim() || customer.name;
    customer.email = req.body.email?.trim() || customer.email;
    customer.phone = req.body.phone?.trim() || customer.phone;
    customer.address = req.body.address?.trim() || customer.address;

    console.log('Updating customer with data:', customer);
    const updatedCustomer = await customer.save();
    console.log('Customer updated successfully:', updatedCustomer);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.deleteOne();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download customers as PDF
router.get('/download/pdf', async (req, res) => {
  try {
    const customers = await Customer.find();
    
    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.pdf');
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Customer List', { align: 'center' });
    doc.moveDown();
    
    // Add table headers
    doc.fontSize(12);
    doc.text('Name', 50, doc.y, { width: 150 });
    doc.text('Email', 200, doc.y - doc.currentLineHeight(), { width: 150 });
    doc.text('Phone', 350, doc.y - doc.currentLineHeight(), { width: 150 });
    
    doc.moveDown();
    
    // Add customer data
    customers.forEach(customer => {
      const y = doc.y;
      doc.text(customer.name || '', 50, y, { width: 150 });
      doc.text(customer.email || '', 200, y, { width: 150 });
      doc.text(customer.phone || '', 350, y, { width: 150 });
      doc.moveDown();
    });
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download customers as Excel
router.get('/download/excel', async (req, res) => {
  try {
    const customers = await Customer.find();
    
    // Prepare data for Excel
    const data = customers.map(customer => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone,
      Address: customer.address
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 