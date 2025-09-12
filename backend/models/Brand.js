const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  totalStock: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add middleware to handle validation errors
brandSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Brand name must be unique'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Brand', brandSchema); 