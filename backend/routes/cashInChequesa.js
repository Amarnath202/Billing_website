const express = require('express');
const router = express.Router();
const CashInChequesa = require('../models/CashInChequesa');

// Get all cheque transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await CashInChequesa.find().sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a specific cheque transaction
router.get('/:id', async (req, res) => {
    try {
        const transaction = await CashInChequesa.findById(req.params.id);
        if (transaction) {
            res.json(transaction);
        } else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new cheque transaction
router.post('/', async (req, res) => {
    const transaction = new CashInChequesa({
        orderId: req.body.orderId,
        date: req.body.date,
        dueDate: req.body.dueDate,
        customer: req.body.customer,
        product: req.body.product,
        quantity: req.body.quantity,
        totalAmount: req.body.totalAmount,
        amountPaid: req.body.amountPaid,
        paymentType: req.body.paymentType || 'Cheque',
        paymentNote: req.body.paymentNote
    });

    try {
        const newTransaction = await transaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a cheque transaction
router.put('/:id', async (req, res) => {
    try {
        const transaction = await CashInChequesa.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (req.body.orderId) transaction.orderId = req.body.orderId;
        if (req.body.date) transaction.date = req.body.date;
        if (req.body.dueDate) transaction.dueDate = req.body.dueDate;
        if (req.body.customer) transaction.customer = req.body.customer;
        if (req.body.product) transaction.product = req.body.product;
        if (req.body.quantity) transaction.quantity = req.body.quantity;
        if (req.body.totalAmount) transaction.totalAmount = req.body.totalAmount;
        if (req.body.amountPaid) transaction.amountPaid = req.body.amountPaid;
        if (req.body.paymentType) transaction.paymentType = req.body.paymentType;
        if (req.body.paymentNote !== undefined) transaction.paymentNote = req.body.paymentNote;

        const updatedTransaction = await transaction.save();
        res.json(updatedTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a cheque transaction
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await CashInChequesa.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        await transaction.deleteOne();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 