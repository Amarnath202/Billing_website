const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// GET /api/expenses - Get all expenses with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      paymentType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (paymentType) filter.paymentType = paymentType;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { expenseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    res.json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      message: 'Error fetching expenses',
      error: error.message
    });
  }
});

// GET /api/expenses/stats - Get expense statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Expense.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ 
      message: 'Error fetching expense statistics', 
      error: error.message 
    });
  }
});

// GET /api/expenses/categories - Get unique categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Expense.distinct('category');
    res.json(categories.sort());
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ 
      message: 'Error fetching expense categories', 
      error: error.message 
    });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ 
      message: 'Error fetching expense', 
      error: error.message 
    });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const {
      date,
      category,
      amount,
      paymentType,
      description,
      vendor,
      reference,
      status
    } = req.body;
    
    // Validate required fields
    if (!category || !amount || !paymentType) {
      return res.status(400).json({ 
        message: 'Category, amount, and payment type are required' 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than 0' 
      });
    }
    
    const expense = new Expense({
      date: date ? new Date(date) : new Date(),
      category: category.trim(),
      amount: parseFloat(amount),
      paymentType,
      description: description?.trim() || '',
      vendor: vendor?.trim() || '',
      reference: reference?.trim() || '',
      status: status || 'Pending'
    });
    
    const savedExpense = await expense.save();
    
    console.log('Expense created:', savedExpense);
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Expense number already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating expense', 
      error: error.message 
    });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const {
      date,
      category,
      amount,
      paymentType,
      description,
      vendor,
      reference,
      status
    } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Validate required fields
    if (!category || !amount || !paymentType) {
      return res.status(400).json({ 
        message: 'Category, amount, and payment type are required' 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than 0' 
      });
    }
    
    // Update expense fields
    expense.date = date ? new Date(date) : expense.date;
    expense.category = category.trim();
    expense.amount = parseFloat(amount);
    expense.paymentType = paymentType;
    expense.description = description?.trim() || '';
    expense.vendor = vendor?.trim() || '';
    expense.reference = reference?.trim() || '';
    expense.status = status || expense.status;
    
    const updatedExpense = await expense.save();
    
    console.log('Expense updated:', updatedExpense);
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ 
      message: 'Error updating expense', 
      error: error.message 
    });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    await Expense.findByIdAndDelete(req.params.id);
    
    console.log('Expense deleted:', expense.expenseNumber);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ 
      message: 'Error deleting expense', 
      error: error.message 
    });
  }
});

module.exports = router;
