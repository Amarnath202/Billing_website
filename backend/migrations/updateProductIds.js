const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/billing-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function migrateProducts() {
  try {
    // Find all products
    const products = await Product.find({});
    
    for (const product of products) {
      // If product has itemCode but no productId
      if (product._doc.itemCode && !product._doc.productId) {
        // Update the document to use productId instead of itemCode
        await Product.updateOne(
          { _id: product._id },
          { 
            $set: { productId: product._doc.itemCode },
            $unset: { itemCode: "" }
          }
        );
        console.log(`Updated product ${product._id}: ${product._doc.itemCode} -> ${product._doc.itemCode}`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

migrateProducts(); 