const express = require('express');
const router = express.Router();
const CashInHandSales = require('../models/CashInHandsa');

// Get all cash in hand transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await CashInHandSales.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new cash in hand transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new CashInHandSales({
      orderId: req.body.orderId,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      customer: req.body.customer,
      product: req.body.product,
      quantity: parseInt(req.body.quantity),
      totalAmount: parseFloat(req.body.totalAmount),
      amountPaid: parseFloat(req.body.amountPaid),
      paymentType: req.body.paymentType || 'Cash',
      paymentNote: req.body.paymentNote
    });

    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete cash in hand transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await CashInHandSales.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cash in hand transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await CashInHandSales.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const updates = {
      orderId: req.body.orderId,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      customer: req.body.customer,
      product: req.body.product,
      quantity: parseInt(req.body.quantity),
      totalAmount: parseFloat(req.body.totalAmount),
      amountPaid: parseFloat(req.body.amountPaid),
      paymentType: req.body.paymentType || 'Cash',
      paymentNote: req.body.paymentNote
    };

    const updatedTransaction = await CashInHandSales.findByIdAndUpdate(
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