require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

async function createRoles() {
  try {
    console.log('🚀 Creating roles in Atlas...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to Atlas');
    
    // Create Admin Role
    const adminRole = await Role.findOneAndUpdate(
      { name: 'Admin' },
      {
        name: 'Admin',
        status: 'Active',
        permissions: [
          { module: 'Dashboard', visible: true },
          { module: 'Users', visible: true },
          { module: 'Roles', visible: true },
          { module: 'Products', visible: true },
          { module: 'Sales Invoice', visible: true },
          { module: 'Customers', visible: true },
          { module: 'Suppliers', visible: true },
          { module: 'Reports', visible: true },
          { module: 'Settings', visible: true }
        ]
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Admin role created');
    
    // Create User Role
    const userRole = await Role.findOneAndUpdate(
      { name: 'User' },
      {
        name: 'User',
        status: 'Active',
        permissions: [
          { module: 'Dashboard', visible: true },
          { module: 'Profile', visible: true },
          { module: 'Products', visible: true }
        ]
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ User role created');
    
    // List all roles
    const allRoles = await Role.find();
    console.log('📋 All roles:', allRoles.map(r => r.name));
    
    console.log('🎉 Roles created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createRoles();
