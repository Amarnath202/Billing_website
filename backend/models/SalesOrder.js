const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: function() {
      return this.isNew ? false : true; // Only required after first save
    }
  },
  date: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
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
    min: 1
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Bank', 'Cheque'],
    default: 'Cash'
  },
  accountNumber: {
    type: String,
    required: function() {
      return this.paymentType === 'Bank';
    },
    validate: {
      validator: function(v) {
        if (this.paymentType === 'Bank') {
          return v && v.trim().length > 0;
        }
        return true;
      },
      message: 'Account number is required for bank payments'
    }
  },
  paymentNote: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Generate order number before saving
salesOrderSchema.pre('save', async function(next) {
  try {
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Find the latest order for today
      const latestOrder = await this.constructor.findOne({
        orderNumber: new RegExp(`^SO-${year}${month}${day}-`)
      }).sort({ orderNumber: -1 });

      let sequence = '001';
      if (latestOrder) {
        const lastSequence = parseInt(latestOrder.orderNumber.split('-').pop());
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }

      this.orderNumber = `SO-${year}${month}${day}-${sequence}`;
    }

  
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('SalesOrder', salesOrderSchema); 