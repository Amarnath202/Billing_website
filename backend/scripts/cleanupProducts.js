const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/billing-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the products collection
    const collection = mongoose.connection.collection('products');
    
    // List all products
    console.log('\nCurrent products in database:');
    const products = await collection.find({}).toArray();
    products.forEach(product => {
      console.log(`ID: ${product.productId}, Name: ${product.name}`);
    });

    // Drop all indexes except _id
    console.log('\nDropping all indexes...');
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        await collection.dropIndex(index.name);
        console.log(`Dropped index: ${index.name}`);
      }
    }

    // Recreate the unique index on productId
    console.log('\nRecreating productId index...');
    await collection.createIndex({ productId: 1 }, { unique: true });
    
    console.log('\nCleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

cleanupProducts(); 