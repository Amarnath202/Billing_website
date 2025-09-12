const mongoose = require('mongoose');
const Role = require('../models/Role');

const setupDefaultRole = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/billing-system');
    console.log('Connected to MongoDB');

    // Check if Employee role exists
    let employeeRole = await Role.findOne({ name: 'Employee' });

    if (!employeeRole) {
      // Create default permissions for Employee role
      const defaultPermissions = [
        { module: 'Dashboard', visible: true },
        { module: 'Sales', visible: true },
        { module: 'Purchases', visible: true },
        { module: 'Products', visible: true },
        { module: 'Customers', visible: true },
        { module: 'Suppliers', visible: true },
        { module: 'Reports', visible: true }
      ];

      employeeRole = new Role({
        name: 'Employee',
        permissions: defaultPermissions,
        status: 'Active'
      });

      await employeeRole.save();
      console.log('Default Employee role created successfully:', employeeRole);
    } else {
      console.log('Employee role already exists:', employeeRole);
    }

    // Check if Admin role exists
    let adminRole = await Role.findOne({ name: 'Admin' });

    if (!adminRole) {
      // Create admin role with full permissions
      const adminPermissions = [
        { module: 'Dashboard', visible: true },
        { module: 'Sales', visible: true },
        { module: 'Purchases', visible: true },
        { module: 'Products', visible: true },
        { module: 'Customers', visible: true },
        { module: 'Suppliers', visible: true },
        { module: 'Reports', visible: true },
        { module: 'Users', visible: true },
        { module: 'Settings', visible: true }
      ];

      adminRole = new Role({
        name: 'Admin',
        permissions: adminPermissions,
        status: 'Active'
      });

      await adminRole.save();
      console.log('Admin role created successfully:', adminRole);
    } else {
      console.log('Admin role already exists:', adminRole);
    }

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

setupDefaultRole(); 