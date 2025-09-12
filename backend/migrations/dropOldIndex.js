const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the products collection
    const collection = mongoose.connection.collection('products');
    
    // Drop the old itemCode index
    await collection.dropIndex('itemCode_1');
    console.log('Successfully dropped old itemCode index');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropOldIndex(); 