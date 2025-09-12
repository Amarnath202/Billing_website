const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');

async function forceUpdateSupplierIds() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/billing-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all suppliers ordered by creation date
    const suppliers = await Supplier.find().sort({ createdAt: 1 });
    console.log(`Found ${suppliers.length} suppliers to update`);

    // Drop the index on supplierId to avoid unique constraint issues during update
    try {
      await mongoose.connection.collection('suppliers').dropIndex('supplierId_1');
      console.log('Dropped supplierId index');
    } catch (error) {
      console.log('No existing index to drop');
    }

    // Update each supplier with a new sequential ID
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i];
      const newSupplierId = `SUP${(i + 1).toString().padStart(4, '0')}`;
      
      await Supplier.findByIdAndUpdate(
        supplier._id,
        { supplierId: newSupplierId },
        { new: true, runValidators: false }
      );
      console.log(`Updated ${supplier.name} with ID: ${newSupplierId}`);
    }

    // Recreate the unique index
    await mongoose.connection.collection('suppliers').createIndex(
      { supplierId: 1 },
      { unique: true }
    );
    console.log('Recreated supplierId unique index');

    console.log('Successfully updated all supplier IDs');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

forceUpdateSupplierIds(); 