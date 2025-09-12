const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download suppliers as PDF
router.get('/download/pdf', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    
    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers.pdf');
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Supplier List', { align: 'center' });
    doc.moveDown();
    
    // Add table headers
    doc.fontSize(12);
    doc.text('Name', 50, doc.y, { width: 150 });
    doc.text('Email', 200, doc.y - doc.currentLineHeight(), { width: 150 });
    doc.text('Phone', 350, doc.y - doc.currentLineHeight(), { width: 150 });
    
    doc.moveDown();
    
    // Add supplier data
    suppliers.forEach(supplier => {
      const y = doc.y;
      doc.text(supplier.name || '', 50, y, { width: 150 });
      doc.text(supplier.email || '', 200, y, { width: 150 });
      doc.text(supplier.phone || '', 350, y, { width: 150 });
      doc.moveDown();
    });
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download suppliers as Excel
router.get('/download/excel', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    
    // Prepare data for Excel
    const data = suppliers.map(supplier => ({
      Name: supplier.name,
      Email: supplier.email,
      Phone: supplier.phone,
      Address: supplier.address
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers.xlsx');
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new supplier
router.post('/', async (req, res) => {
  try {
    const supplier = new Supplier({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address
    });

    const newSupplier = await supplier.save();
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (req.body.name) supplier.name = req.body.name;
    if (req.body.phone) supplier.phone = req.body.phone;
    if (req.body.email) supplier.email = req.body.email;
    if (req.body.address) supplier.address = req.body.address;

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a supplier
router.patch('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const { name, email, phone, address } = req.body;
    
    if (name) supplier.name = name;
    if (email) supplier.email = email;
    if (phone) supplier.phone = phone;
    if (address) supplier.address = address;

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    await supplier.deleteOne();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 