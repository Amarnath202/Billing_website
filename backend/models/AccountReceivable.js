const mongoose = require('mongoose');

const accountReceivableSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
    trim: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: props => `${props.value} is not a valid amount. Amount must be greater than 0.`
    }
  },
  amountPaid: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Amount paid cannot be negative'],
    validate: {
      validator: function(v) {
        return v <= this.amount;
      },
      message: props => `Amount paid (${props.value}) cannot exceed total amount (${this.amount}).`
    }
  },
  balance: {
    type: Number,
    default: function() {
      return this.amount - (this.amountPaid || 0);
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Received', 'Overdue'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Calculate balance and update status before saving
accountReceivableSchema.pre('save', function(next) {
  // Ensure amount is valid
  if (!this.amount || this.amount <= 0) {
    next(new Error('Total amount must be greater than 0'));
    return;
  }

  // Ensure amountPaid is valid
  if (this.amountPaid < 0) {
    next(new Error('Amount paid cannot be negative'));
    return;
  }

  if (this.amountPaid > this.amount) {
    next(new Error('Amount paid cannot exceed total amount'));
    return;
  }

  // Calculate balance
  this.balance = this.amount - (this.amountPaid || 0);
  
  // Update status based on payment and due date
  if (this.amountPaid >= this.amount) {
    this.status = 'Received';
  } else if (this.amountPaid > 0) {
    this.status = 'Partially Paid';
  } else {
    const today = new Date();
    const dueDate = this.date;
    this.status = today > dueDate ? 'Overdue' : 'Pending';
  }
  
  next();
});

module.exports = mongoose.model('AccountReceivable', accountReceivableSchema); 