const mongoose = require('mongoose');

const cashInBankSalesSchema = new mongoose.Schema({
  orderId: {
    type: String,
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
  customer: {
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
  paymentType: {
    type: String,
    enum: ['Cash', 'Bank', 'Cheque'],
    default: 'Bank'
  },
  accountNumber: {
    type: String,
    required: true
  },
  paymentNote: {
    type: String,
    maxlength: 500
  },
  transactionId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `${this.orderId}-${Date.now()}`;
    }
  }
}, {
  timestamps: true,
  collection: 'cashinbanksa'
});

// Calculate balance and status before saving
cashInBankSalesSchema.pre('save', function(next) {
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

module.exports = mongoose.model('CashInBankSales', cashInBankSalesSchema); 