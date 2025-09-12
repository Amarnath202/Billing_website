require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

// All available modules for the system
const AVAILABLE_MODULES = [
  'Dashboard', 'Customers', 'Suppliers', 'Sales Invoice', 'Barcode', 
  'Sales History', 'Payment In', 'Sales Order', 'Sales Cash & Bank', 
  'Sales Return', 'Payment Out', 'Purchase', 'Purchase Cash & Bank', 
  'Purchase Return', 'Products', 'Brands', 'Categories', 'Warehouses', 
  'Expenses List', 'Profit and Loss', 'Purchase Report', 'Sales Report', 
  'Product Report', 'Expense Report', 'Send Email', 'Email History', 
  'App Settings', 'Profile', 'Users', 'Roles', 'Tax', 'Discount'
];

async function setupAtlasDatabase() {
  try {
    console.log('🚀 Setting up MongoDB Atlas database...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // 1. Create Admin Role
    console.log('\n🔑 Setting up Admin role...');
    let adminRole = await Role.findOne({ name: 'Admin' });
    
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        status: 'Active',
        permissions: AVAILABLE_MODULES.map(module => ({
          module,
          visible: true
        }))
      });
      await adminRole.save();
      console.log('✅ Admin role created with full permissions');
    } else {
      // Update existing admin role with all permissions
      adminRole.permissions = AVAILABLE_MODULES.map(module => ({
        module,
        visible: true
      }));
      await adminRole.save();
      console.log('✅ Admin role updated with full permissions');
    }
    
    // 2. Create User Role
    console.log('\n👤 Setting up User role...');
    let userRole = await Role.findOne({ name: 'User' });
    
    if (!userRole) {
      userRole = new Role({
        name: 'User',
        status: 'Active',
        permissions: [
          { module: 'Dashboard', visible: true },
          { module: 'Profile', visible: true },
          { module: 'Products', visible: true },
          { module: 'Sales Invoice', visible: true },
          { module: 'Customers', visible: true }
        ]
      });
      await userRole.save();
      console.log('✅ User role created with basic permissions');
    } else {
      console.log('✅ User role already exists');
    }
    
    // 3. Create default admin user if none exists
    console.log('\n👨‍💼 Setting up default admin user...');
    const adminUser = await User.findOne({ email: 'admin@billing.com' });
    
    if (!adminUser) {
      const newAdminUser = new User({
        firstName: 'System',
        lastName: 'Administrator',
        username: 'admin',
        email: 'admin@billing.com',
        password: 'admin123', // Will be hashed automatically
        role: adminRole._id,
        status: 'Active',
        mobile: '1234567890'
      });
      
      await newAdminUser.save();
      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@billing.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // 4. Display summary
    console.log('\n📊 Database Setup Summary:');
    const totalUsers = await User.countDocuments();
    const totalRoles = await Role.countDocuments();
    const adminUsers = await User.countDocuments({ role: adminRole._id });
    const userUsers = await User.countDocuments({ role: userRole._id });
    
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`🔑 Total Roles: ${totalRoles}`);
    console.log(`👨‍💼 Admin Users: ${adminUsers}`);
    console.log(`👤 Regular Users: ${userUsers}`);
    
    console.log('\n🎉 Atlas database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Login with admin@billing.com / admin123');
    console.log('3. Create additional users as needed');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 11000) {
      console.error('🔄 Duplicate key error - some data already exists');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
}

// Run the setup
setupAtlasDatabase();
