const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

async function migrateUserRoles() {
  let connection;
  try {
    // Connect to MongoDB
    connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    // Get all roles
    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles in the system`);

    if (roles.length === 0) {
      console.log('No roles found. Creating default roles...');
      
      // Create default roles if they don't exist
      const adminRole = await Role.create({
        name: 'Admin',
        status: 'Active',
        permissions: AVAILABLE_MODULES.map(module => ({
          module,
          visible: true
        }))
      });

      console.log('Created Admin role:', adminRole);

      const userRole = await Role.create({
        name: 'User',
        status: 'Active',
        permissions: AVAILABLE_MODULES.map(module => ({
          module,
          visible: true
        }))
      });

      console.log('Created User role:', userRole);

      roles.push(adminRole, userRole);
      console.log('Created default roles: Admin and User');
    }

    // Create a map of role names to role IDs for quick lookup (case insensitive)
    const roleMap = roles.reduce((map, role) => {
      console.log(`Adding role to map: ${role.name} -> ${role._id}`);
      map[role.name.toLowerCase()] = role._id;
      return map;
    }, {});

    console.log('Role map:', roleMap);

    // Get the admin role ID (we'll use this as default for users without roles)
    const adminRoleId = roleMap['admin'];
    if (!adminRoleId) {
      throw new Error('Admin role not found in the database');
    }

    console.log('Using admin role ID:', adminRoleId);

    // Update each user
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`\nProcessing user: ${user.email}`);
        console.log('Current role:', user.role);

        // Skip if role is already an ObjectId and valid
        if (mongoose.Types.ObjectId.isValid(user.role)) {
          const roleExists = await Role.findById(user.role);
          if (roleExists) {
            console.log(`User ${user.email} already has a valid role ObjectId`);
            continue;
          }
        }

        // For users without a role or with invalid role, set them as admin
        if (user.email.includes('admin')) {
          // If email contains 'admin', make them an admin
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { role: adminRoleId },
            { new: true }
          );
          console.log(`Set admin role for user: ${user.email}`);
          console.log('Updated user:', updatedUser);
        } else {
          // For other users, also set admin role (you can modify this logic as needed)
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { role: adminRoleId },
            { new: true }
          );
          console.log(`Set admin role for user: ${user.email} (default)`);
          console.log('Updated user:', updatedUser);
        }
        successCount++;
      } catch (error) {
        console.error(`Error updating user ${user.email}:`, error);
        console.error('Full error:', JSON.stringify(error, null, 2));
        errorCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${errorCount}`);

    console.log('\nMigration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
  } finally {
    // Close MongoDB connection
    if (connection) {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Get all available modules from the User model validation
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

// Run the migration
migrateUserRoles(); 