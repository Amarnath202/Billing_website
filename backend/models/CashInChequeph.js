const mongoose = require('mongoose');

const cashInChequeSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  supplier: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0.01
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Bank', 'Cheque'],
    default: 'Cheque'
  },

  paymentNote: {
    type: String,
    maxlength: 500
  },
  balance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Partial'],
    default: 'Partial'
  }
}, {
  timestamps: true,
  collection: 'cashinchequephs'
});

// Calculate balance and status before saving
cashInChequeSchema.pre('save', function(next) {
  this.balance = this.totalAmount - this.amountPaid;
  this.status = this.balance === 0 ? 'Paid' : 'Partial';
  next();
});

module.exports = mongoose.model('CashInCheque', cashInChequeSchema);
