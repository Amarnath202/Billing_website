const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system';

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Create admin role if it doesn't exist
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        status: 'Active',
        permissions: [
          {
            module: 'Users',
            actions: ['create', 'edit', 'view', 'delete']
          }
        ]
      });
      await adminRole.save();
      console.log('Admin role created successfully');
    }

    // Check if test user already exists
    let testUser = await User.findOne({ email: 'admin123@gmail.com' });
    if (testUser) {
      console.log('Test user already exists:', {
        email: testUser.email,
        username: testUser.username
      });
      return;
    }

    // Create a test user
    testUser = new User({
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin123@gmail.com',
      password: 'admin123',
      role: 'Admin',
      status: 'Active',
      mobile: '1234567890'
    });

    // Save the user
    await testUser.save();
    console.log('Test user created successfully:', {
      email: testUser.email,
      username: testUser.username
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createTestUser(); 