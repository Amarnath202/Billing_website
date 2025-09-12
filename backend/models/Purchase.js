const mongoose = require('mongoose');

// Create a schema for the counter
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank', 'Cheque']
  },
  accountNumber: {
    type: String,
    required: function() {
      return this.paymentType === 'Bank';
    },
    validate: {
      validator: function(v) {
        if (this.paymentType === 'Bank') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Account number is required for bank payments'
    }
  },
  paymentNote: {
    type: String,
    maxlength: 500
  }
});

const purchaseSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: function() {
      return this.isNew ? false : true; // Only required after first save
    }
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Invalid date format'
    }
  },
  dueDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Invalid due date format'
    }
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  total: {
    type: Number,
    required: true,
    min: [0.01, 'Total amount must be greater than 0']
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  },
  payments: {
    type: [paymentSchema],
    validate: {
      validator: function(payments) {
        if (!payments.length) return true; // Allow empty payments array
        return payments.every(payment => 
          payment.amount > 0 && 
          ['Cash', 'Bank', 'Cheque'].includes(payment.paymentType)
        );
      },
      message: 'Invalid payment data'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate order ID
purchaseSchema.pre('save', async function(next) {
  try {
    if (!this.orderId) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      // Generate order ID in format PO-YYYYMMDD-XXXX
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.orderId = `PO-${year}${month}${day}-${String(counter.seq).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Generate order ID and calculate balance before saving
purchaseSchema.pre('validate', async function(next) {
  try {
    // Calculate balance
    const totalPaid = this.payments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
    this.balance = this.total - totalPaid;

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Purchase', purchaseSchema); 