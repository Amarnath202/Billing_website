const express = require('express');
const router = express.Router();
const CashInCheque = require('../models/CashInChequeph');

// Get all cash in cheque transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await CashInCheque.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new cash in cheque transaction
router.post('/', async (req, res) => {
  try {
    console.log('Creating cheque transaction with data:', req.body);

    // Validate required fields
    if (!req.body.orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const transaction = new CashInCheque({
      orderId: req.body.orderId,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      supplier: req.body.supplier,
      product: req.body.product,
      quantity: parseInt(req.body.quantity),
      totalAmount: parseFloat(req.body.totalAmount),
      amountPaid: parseFloat(req.body.amountPaid),
      paymentType: req.body.paymentType || 'Cheque',
      paymentNote: req.body.paymentNote
    });

    console.log('Attempting to save cheque transaction:', transaction);
    const newTransaction = await transaction.save();
    console.log('Cheque transaction saved successfully:', newTransaction);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating cheque transaction:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ message: error.message, details: error.stack });
  }
});

// Delete cash in cheque transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await CashInCheque.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cash in cheque transaction
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating cheque transaction with ID:', req.params.id);
    console.log('Update data:', req.body);

    const transaction = await CashInCheque.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const updates = {
      orderId: req.body.orderId,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      supplier: req.body.supplier,
      product: req.body.product,
      quantity: parseInt(req.body.quantity),
      totalAmount: parseFloat(req.body.totalAmount),
      amountPaid: parseFloat(req.body.amountPaid),
      paymentType: req.body.paymentType || 'Cheque',
      paymentNote: req.body.paymentNote
    };

    console.log('Applying updates:', updates);
    const updatedTransaction = await CashInCheque.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    console.log('Cheque transaction updated successfully:', updatedTransaction);
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating cheque transaction:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ message: error.message, details: error.stack });
  }
});



module.exports = router;
