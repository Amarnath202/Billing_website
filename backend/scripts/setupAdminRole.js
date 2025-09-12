const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

// List of all available modules
const AVAILABLE_MODULES = [
  'Dashboard',
  'Products',
  'Categories',
  'Brands',
  'Sales Invoice',
  'Sales History',
  'Sales Order',
  'Sales Return',
  'Purchase',
  'Purchase Return',
  'Customers',
  'Suppliers',
  'Expenses List',
  'Payment In',
  'Payment Out',
  'Sales Cash & Bank',
  'Purchase Cash & Bank',
  'Barcode',
  'Users',
  'Roles',
  'Profile',
  'App Settings',
  'Warehouses',
  'Send Email',
  'Email History',
  'Tax',
  'Discount',
  'Profit and Loss',
  'Purchase Report',
  'Sales Report',
  'Product Report',
  'Expense Report'
];

async function setupAdminRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Create or update admin role
    const adminRole = await Role.findOneAndUpdate(
      { name: 'admin' },
      {
        name: 'admin',
        status: 'Active',
        permissions: AVAILABLE_MODULES.map(module => ({
          module,
          visible: true
        }))
      },
      { upsert: true, new: true }
    );

    console.log('Admin role created/updated:', adminRole);

    // Update all users with undefined roles to use admin role
    const usersUpdated = await User.updateMany(
      { $or: [{ role: undefined }, { role: null }] },
      { role: adminRole._id }
    );

    console.log('Users updated:', usersUpdated);

    // Find admin user and ensure they have admin role
    const adminUser = await User.findOne({ email: 'controlnadmin@gmail.com' });
    if (adminUser) {
      adminUser.role = adminRole._id;
      await adminUser.save();
      console.log('Admin user updated with admin role');
    }

    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
setupAdminRole(); 