const mongoose = require('mongoose');
require('dotenv').config();

async function resetProductsCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the entire products collection
    await mongoose.connection.db.dropCollection('products');
    console.log('Successfully dropped products collection');

    // The collection will be automatically recreated with the new schema
    // when the first document is inserted

  } catch (error) {
    if (error.code === 26) {
      console.log('Collection does not exist, proceeding...');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetProductsCollection(); 