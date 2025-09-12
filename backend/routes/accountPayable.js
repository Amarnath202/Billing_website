const express = require('express');
const router = express.Router();
const AccountPayable = require('../models/AccountPayable');

// Get all account payables
router.get('/', async (req, res) => {
  try {
    const payables = await AccountPayable.find()
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    // Calculate total balance for each account payable
    const processedPayables = payables.map(payable => ({
      ...payable,
      balance: parseFloat(payable.totalAmount || 0) - parseFloat(payable.amountPaid || 0)
    }));

    res.json(processedPayables);
  } catch (error) {
    console.error('Error fetching payables:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get account payable by ID
router.get('/:id', async (req, res) => {
  try {
    const payable = await AccountPayable.findById(req.params.id);
    if (!payable) {
      return res.status(404).json({ message: 'Account payable not found' });
    }
    res.json(payable);
  } catch (error) {
    console.error('Error fetching payable:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new account payable
router.post('/', async (req, res) => {
  try {
    const { supplier, invoiceNumber, description, totalAmount, amountPaid } = req.body;
    
    // Validate required fields
    if (!supplier || !invoiceNumber || !description || totalAmount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const payable = new AccountPayable({
      supplier,
      invoiceNumber,
      description,
      totalAmount: parseFloat(totalAmount),
      amountPaid: parseFloat(amountPaid || 0)
    });

    const newPayable = await payable.save();
    res.status(201).json(newPayable);
  } catch (error) {
    console.error('Error creating payable:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update account payable - support both PUT and PATCH
router.put('/:id', updatePayable);
router.patch('/:id', updatePayable);

async function updatePayable(req, res) {
  try {
    const payable = await AccountPayable.findById(req.params.id);
    if (!payable) {
      return res.status(404).json({ message: 'Account payable not found' });
    }

    // Update only the fields that are provided
    if (req.body.supplier !== undefined) payable.supplier = req.body.supplier;
    if (req.body.invoiceNumber !== undefined) payable.invoiceNumber = req.body.invoiceNumber;
    if (req.body.description !== undefined) payable.description = req.body.description;
    if (req.body.totalAmount !== undefined) payable.totalAmount = parseFloat(req.body.totalAmount);
    if (req.body.amountPaid !== undefined) payable.amountPaid = parseFloat(req.body.amountPaid);

    const updatedPayable = await payable.save();
    res.json(updatedPayable);
  } catch (error) {
    console.error('Error updating payable:', error);
    res.status(400).json({ message: error.message });
  }
}

// Delete account payable
router.delete('/:id', async (req, res) => {
  try {
    const payable = await AccountPayable.findById(req.params.id);
    if (!payable) {
      return res.status(404).json({ message: 'Account payable not found' });
    }
    await payable.deleteOne();
    res.json({ message: 'Account payable deleted successfully' });
  } catch (error) {
    console.error('Error deleting payable:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 