const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const AccountPayable = require('../models/AccountPayable');

// Helper function to update supplier's account payable
async function updateSupplierAccountPayable(supplier) {
  try {
    // Get all purchases for this supplier
    const purchases = await Purchase.find({ supplier }).populate('supplier');
    
    if (!purchases.length) return;

    // Calculate total amount and paid amount from all purchases
    let totalAmount = 0;
    let totalPaid = 0;

    purchases.forEach(purchase => {
      // Add to total amount
      totalAmount += Number(purchase.total) || 0;
      // Add up all payments from the payments array
      const purchasePaid = purchase.payments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
      totalPaid += purchasePaid;
    });

    // Get supplier name from the first purchase
    const supplierName = purchases[0].supplier.name;

    // Find the first/original payable record for this supplier
    let payable = await AccountPayable.findOne({ 
      supplier: supplierName 
    }).sort({ createdAt: 1 }); // Get the oldest record

    if (payable) {
      // Update the original record with new totals
      payable.totalAmount = totalAmount;
      payable.amountPaid = totalPaid;
      await payable.save();
      
      // Delete any other payable records for this supplier
      await AccountPayable.deleteMany({
        supplier: supplierName,
        _id: { $ne: payable._id }
      });

      console.log(`Updated original payable for ${supplierName}:`, {
        id: payable._id,
        totalAmount,
        totalPaid
      });
    } else {
      // Create new payable only if none exists
      payable = new AccountPayable({
        supplier: supplierName,
        invoiceNumber: `PO-${supplierName}-TOTAL`,
        description: `Supplier total`,
        totalAmount: totalAmount,
        amountPaid: totalPaid
      });
      await payable.save();
      console.log(`Created first payable for ${supplierName}`);
    }
    
  } catch (error) {
    console.error('Error updating supplier account payable:', error);
    throw error;
  }
}

// Get supplier-wise total amounts
router.get('/supplier-totals', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier', 'name');
    
    // Group purchases by supplier and calculate totals
    const supplierTotals = {};
    purchases.forEach(purchase => {
      if (purchase.supplier && purchase.supplier.name) {
        const supplierName = purchase.supplier.name;
        if (!supplierTotals[supplierName]) {
          supplierTotals[supplierName] = {
            totalAmount: 0,
            purchases: []
          };
        }
        supplierTotals[supplierName].totalAmount += purchase.total;
        supplierTotals[supplierName].purchases.push({
          id: purchase._id,
          invoice: purchase.invoice,
          total: purchase.total
        });
      }
    });
    
    res.json(supplierTotals);
  } catch (error) {
    console.error('Error getting supplier totals:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier')
      .populate('product')
      .populate('warehouse');
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get purchase by ID
router.get('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name')
      .populate('product', 'name')
      .populate('warehouse', 'name');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new purchase
router.post('/', async (req, res) => {
  try {
    const { date, dueDate, supplier, product, warehouse, quantity, total, payments } = req.body;
    
    // Calculate balance based on payments
    const totalPayments = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const balance = parseFloat(total) - totalPayments;
    
    // Create new purchase with all required fields
    const purchase = new Purchase({
      date: new Date(date),
      dueDate: new Date(dueDate),
      supplier,
      product,
      warehouse,
      quantity: parseInt(quantity),
      total: parseFloat(total),
      payments: payments || [],
      balance: balance
    });

    const newPurchase = await purchase.save();
    await newPurchase.populate(['supplier', 'product', 'warehouse']);
    
    // Update supplier's account payable
    await updateSupplierAccountPayable(supplier);
    
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update purchase
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating purchase with ID:', req.params.id);
    console.log('Update data:', req.body);

    const { date, dueDate, supplier, product, warehouse, quantity, total, payments } = req.body;
    
    // Calculate balance based on payments
    const totalPayments = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const balance = parseFloat(total) - totalPayments;
    
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        date: new Date(date),
        dueDate: new Date(dueDate),
        supplier,
        product,
        warehouse,
        quantity: parseInt(quantity),
        total: parseFloat(total),
        payments: payments || [],
        balance: balance
      },
      { new: true }
    );
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    await purchase.populate(['supplier', 'product', 'warehouse']);

    console.log('Purchase updated successfully:', {
      orderId: purchase.orderId,
      total: purchase.total,
      payments: purchase.payments
    });

    // Update supplier's account payable
    await updateSupplierAccountPayable(supplier);
    console.log('Account payable updated for supplier:', supplier);

    res.json(purchase);
  } catch (error) {
    console.error('Error updating purchase:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    res.status(400).json({ message: error.message, details: error.stack });
  }
});

// Delete purchase
router.delete('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const supplier = purchase.supplier;
    await purchase.deleteOne();
    
    // Update supplier's account payable after deletion
    await updateSupplierAccountPayable(supplier);
    
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 