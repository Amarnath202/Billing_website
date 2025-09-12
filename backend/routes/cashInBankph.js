const express = require('express');
const router = express.Router();
const CashInBank = require('../models/CashInBankph');

// Get all cash in bank transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await CashInBank.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new cash in bank transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new CashInBank({
      orderId: req.body.orderId,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      supplier: req.body.supplier,
      product: req.body.product,
      accountNumber: req.body.accountNumber,
      quantity: parseInt(req.body.quantity),
      totalAmount: parseFloat(req.body.totalAmount),
      amountPaid: parseFloat(req.body.amountPaid),
      paymentType: req.body.paymentType || 'Bank',
      paymentNote: req.body.paymentNote
    });

    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete cash in bank transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await CashInBank.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cash in bank transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await CashInBank.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const updates = {
      orderId: req.body.orderId,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      supplier: req.body.supplier,
      product: req.body.product,
      accountNumber: req.body.accountNumber,
      quantity: parseInt(req.body.quantity),
      totalAmount: parseFloat(req.body.totalAmount),
      amountPaid: parseFloat(req.body.amountPaid),
      paymentType: req.body.paymentType || 'Bank',
      paymentNote: req.body.paymentNote
    };

    const updatedTransaction = await CashInBank.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 