require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    const db = mongoose.connection.db;
    console.log('📊 Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Test a simple query (check if users collection exists)
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    console.log('👥 Total users in database:', userCount);
    
    // Test role collection
    const Role = require('../models/Role');
    const roleCount = await Role.countDocuments();
    console.log('🔑 Total roles in database:', roleCount);
    
    console.log('🎉 Atlas connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('🔐 Authentication failed. Please check your username and password.');
    } else if (error.message.includes('network')) {
      console.error('🌐 Network error. Please check your internet connection and Atlas cluster status.');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Connection timeout. Please check your Atlas cluster is running.');
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  }
}

// Run the test
testConnection();
