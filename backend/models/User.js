const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  mobile: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add middleware to handle username generation and uniqueness
UserSchema.pre('save', async function(next) {
  try {
    if (this.isModified('email')) {
      let baseUsername = this.email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      // Keep trying until we find a unique username
      while (true) {
        const existingUser = await this.constructor.findOne({ username, _id: { $ne: this._id } });
        if (!existingUser) break;
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      this.username = username;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add middleware to hash password before saving
UserSchema.pre('save', function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt and hash the password
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add middleware to validate role exists
UserSchema.pre('save', async function(next) {
  if (this.isModified('role')) {
    try {
      const Role = mongoose.model('Role');
      const role = await Role.findById(this.role);
      if (!role) {
        throw new Error('Invalid role specified');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Add middleware to validate role exists before update
UserSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.role) {
    try {
      const Role = mongoose.model('Role');
      const role = await Role.findById(update.$set.role);
      if (!role) {
        throw new Error('Invalid role specified');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Method to check if password is correct
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 