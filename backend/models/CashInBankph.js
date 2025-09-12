const mongoose = require('mongoose');

const cashInBankSchema = new mongoose.Schema({
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
  balance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  accountNumber: {
    type: String,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Bank', 'Cheque'],
    default: 'Bank'
  },
  paymentNote: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  collection: 'cashinbankphs'
});

// Calculate balance and status before saving
cashInBankSchema.pre('save', function(next) {
  this.balance = this.totalAmount - this.amountPaid;
  
  if (this.amountPaid >= this.totalAmount) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partially Paid';
  } else {
    this.status = 'Unpaid';
  }
  
  next();
});

module.exports = mongoose.model('CashInBank', cashInBankSchema); 