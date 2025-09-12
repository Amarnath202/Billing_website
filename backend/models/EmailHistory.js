const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed'],
    default: 'Sent'
  },
  type: {
    type: String,
    enum: ['Customer', 'Supplier', 'Other'],
    default: 'Other'
  },
  attachmentName: String,
  error: String
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailHistory', emailHistorySchema); 