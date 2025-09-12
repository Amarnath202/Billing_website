const mongoose = require('mongoose');

const salesReturnSchema = new mongoose.Schema({
  returnId: {
    type: String,
    unique: true,
    required: function() {
      return this.isNew ? false : true;
    }
  },
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
  paymentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Bank', 'UPI', 'Card'],
    default: 'Cash'
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate return ID before saving
salesReturnSchema.pre('save', async function(next) {
  try {
    if (!this.returnId && this.isNew) {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Find the latest return for today
      const latestReturn = await this.constructor.findOne({
        returnId: new RegExp(`^SRET-${year}${month}${day}-`)
      }).sort({ returnId: -1 });

      let sequence = '001';
      if (latestReturn) {
        const lastSequence = parseInt(latestReturn.returnId.split('-').pop());
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }

      this.returnId = `SRET-${year}${month}${day}-${sequence}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);

module.exports = SalesReturn; 