const mongoose = require('mongoose');

const accountPayableSchema = new mongoose.Schema({
  supplier: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate balance and update status
accountPayableSchema.pre('save', function(next) {
  // Calculate balance
  this.balance = this.totalAmount - this.amountPaid;
  
  // Update status based on payments
  if (this.amountPaid >= this.totalAmount) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partially Paid';
  } else {
    this.status = 'Unpaid';
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AccountPayable', accountPayableSchema); 