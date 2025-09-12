const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
  },
  permissions: [{
    module: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true
    },
    visible: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add some middleware
RoleSchema.pre('save', function(next) {
  console.log('Saving role:', this);
  next();
});

RoleSchema.post('save', function(doc) {
  console.log('Role saved:', doc);
});

const Role = mongoose.model('Role', RoleSchema);

module.exports = Role; 