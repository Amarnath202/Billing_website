const mongoose = require('mongoose');
const Customer = require('../models/Customer');

require('dotenv').config();
// MongoDB connection URL - update with your connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system';

async function generateCustomerId(index) {
  return `CUS${String(index + 1).padStart(4, '0')}`;
}

async function updateCustomerIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all customers without proper IDs
    const customers = await Customer.find({ customerId: 'PENDING' });
    console.log(`Found ${customers.length} customers to update`);

    // Update each customer with a new ID
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const newCustomerId = await generateCustomerId(i);
      
      // Update the customer
      await Customer.findByIdAndUpdate(customer._id, { customerId: newCustomerId });
      console.log(`Updated customer ${customer._id} with ID ${newCustomerId}`);
    }

    console.log('Successfully updated all customer IDs');
  } catch (error) {
    console.error('Error updating customer IDs:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateCustomerIds(); 