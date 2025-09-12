const express = require('express');
const router = express.Router();
const PurchaseReturn = require('../models/PurchaseReturn');
const Purchase = require('../models/Purchase');

// Get all purchase returns
router.get('/', async (req, res) => {
  try {
    const returns = await PurchaseReturn.find()
      .populate('supplier')
      .populate('product')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    console.error('Error fetching purchase returns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific purchase return
router.get('/:id', async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate('supplier')
      .populate('product');
    if (!purchaseReturn) {
      return res.status(404).json({ message: 'Purchase return not found' });
    }
    res.json(purchaseReturn);
  } catch (error) {
    console.error('Error fetching purchase return:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new purchase return
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      date,
      dueDate,
      supplier,
      product,
      quantity,
      total,
      paymentAmount,
      paymentType,
      reason
    } = req.body;

    // Validate that the original purchase order exists
    const originalPurchase = await Purchase.findOne({ orderId });
    if (!originalPurchase) {
      return res.status(400).json({ message: 'Original purchase order not found' });
    }

    // Validate return quantity doesn't exceed original purchase quantity
    if (quantity > originalPurchase.quantity) {
      return res.status(400).json({ 
        message: 'Return quantity cannot exceed original purchase quantity' 
      });
    }

    const purchaseReturn = new PurchaseReturn({
      orderId,
      date: new Date(date),
      dueDate: new Date(dueDate),
      supplier,
      product,
      quantity: parseInt(quantity),
      total: parseFloat(total),
      paymentAmount: parseFloat(paymentAmount || 0),
      paymentType,
      reason
    });

    const newPurchaseReturn = await purchaseReturn.save();
    await newPurchaseReturn.populate(['supplier', 'product']);
    
    res.status(201).json(newPurchaseReturn);
  } catch (error) {
    console.error('Error creating purchase return:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update purchase return
router.put('/:id', async (req, res) => {
  try {
    const {
      orderId,
      date,
      dueDate,
      supplier,
      product,
      quantity,
      total,
      paymentAmount,
      paymentType,
      reason,
      status
    } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    if (!purchaseReturn) {
      return res.status(404).json({ message: 'Purchase return not found' });
    }

    // Update fields
    if (orderId) purchaseReturn.orderId = orderId;
    if (date) purchaseReturn.date = new Date(date);
    if (dueDate) purchaseReturn.dueDate = new Date(dueDate);
    if (supplier) purchaseReturn.supplier = supplier;
    if (product) purchaseReturn.product = product;
    if (quantity) purchaseReturn.quantity = parseInt(quantity);
    if (total) purchaseReturn.total = parseFloat(total);
    if (paymentAmount !== undefined) purchaseReturn.paymentAmount = parseFloat(paymentAmount);
    if (paymentType) purchaseReturn.paymentType = paymentType;
    if (reason) purchaseReturn.reason = reason;
    if (status) purchaseReturn.status = status;

    const updatedPurchaseReturn = await purchaseReturn.save();
    await updatedPurchaseReturn.populate(['supplier', 'product']);
    
    res.json(updatedPurchaseReturn);
  } catch (error) {
    console.error('Error updating purchase return:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete purchase return
router.delete('/:id', async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    if (!purchaseReturn) {
      return res.status(404).json({ message: 'Purchase return not found' });
    }

    if (purchaseReturn.status === 'Completed') {
      return res.status(400).json({ 
        message: 'Cannot delete a completed purchase return' 
      });
    }

    await PurchaseReturn.findByIdAndDelete(req.params.id);
    res.json({ message: 'Purchase return deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase return:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 