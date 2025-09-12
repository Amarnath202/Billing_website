const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    default: 'PENDING'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Function to generate the next customer ID
async function generateNextCustomerId() {
  try {
    // Find the customer with the highest ID
    const lastCustomer = await Customer.findOne(
      { customerId: { $ne: 'PENDING' } },
      { customerId: 1 },
      { sort: { customerId: -1 } }
    );
    
    if (!lastCustomer || !lastCustomer.customerId) {
      return 'CUS0001';
    }

    // Extract the number from the last ID
    const lastNumber = parseInt(lastCustomer.customerId.slice(3));
    if (isNaN(lastNumber)) {
      return 'CUS0001';
    }

    // Generate the next number
    const nextNumber = lastNumber + 1;
    return `CUS${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating customer ID:', error);
    throw error;
  }
}

// Pre-save middleware to handle customer ID generation
customerSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.customerId === 'PENDING') {
      this.customerId = await generateNextCustomerId();
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 