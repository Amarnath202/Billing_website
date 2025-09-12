const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    required: function() {
      return !this.isNew; // Only required after first save
    }
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank', 'Cheque', 'Credit Card', 'Online Transfer'],
    default: 'Cash'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  vendor: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Index for better search performance
expenseSchema.index({ expenseNumber: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ paymentType: 1 });
expenseSchema.index({ status: 1 });

// Pre-save middleware to generate expense number if not provided
expenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    try {
      const count = await this.constructor.countDocuments();
      this.expenseNumber = `EXP-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to get expense statistics
expenseSchema.statics.getStats = async function() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalExpenses,
      todayExpenses,
      monthlyExpenses,
      yearlyExpenses,
      categoryStats,
      paymentTypeStats
    ] = await Promise.all([
      this.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      this.aggregate([
        { $match: { date: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      this.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      this.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      this.aggregate([
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]),
      this.aggregate([
        { $group: { _id: '$paymentType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    return {
      total: totalExpenses[0]?.total || 0,
      totalCount: totalExpenses[0]?.count || 0,
      today: todayExpenses[0]?.total || 0,
      todayCount: todayExpenses[0]?.count || 0,
      monthly: monthlyExpenses[0]?.total || 0,
      monthlyCount: monthlyExpenses[0]?.count || 0,
      yearly: yearlyExpenses[0]?.total || 0,
      yearlyCount: yearlyExpenses[0]?.count || 0,
      categoryBreakdown: categoryStats,
      paymentTypeBreakdown: paymentTypeStats
    };
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Expense', expenseSchema);
