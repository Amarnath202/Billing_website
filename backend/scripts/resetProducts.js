const mongoose = require('mongoose');
require('dotenv').config();

async function resetProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/billing-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the products collection
    const collection = mongoose.connection.collection('products');
    
    // Drop the collection
    await collection.drop();
    console.log('Products collection dropped');

    // The collection and its indexes will be recreated automatically
    // when the first document is inserted
    console.log('Reset completed successfully');
  } catch (error) {
    if (error.code === 26) {
      console.log('Collection does not exist, no need to drop');
    } else {
      console.error('Error during reset:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetProducts(); 