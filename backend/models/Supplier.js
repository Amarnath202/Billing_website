const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'PENDING'; // Temporary value that will be replaced in pre-save
    }
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Function to get the next supplier ID
async function getNextSupplierId() {
  try {
    const lastSupplier = await mongoose.model('Supplier')
      .findOne({}, { supplierId: 1 })
      .sort({ supplierId: -1 });

    if (!lastSupplier || !lastSupplier.supplierId || lastSupplier.supplierId === 'PENDING') {
      return 'SUP0001';
    }

    // Extract the number from the last ID
    const lastNumber = parseInt(lastSupplier.supplierId.substring(3));
    const nextNumber = lastNumber + 1;
    return `SUP${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating supplier ID:', error);
    throw error;
  }
}

// Pre-save middleware to set supplier ID
supplierSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.supplierId === 'PENDING') {
      this.supplierId = await getNextSupplierId();
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Supplier', supplierSchema); 