const express = require('express');
const router = express.Router();
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

// Get all warehouses
router.get('/', async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    
    // Update counts for all warehouses
    for (const warehouse of warehouses) {
      await Warehouse.updateCounts(warehouse._id);
    }
    
    // Fetch updated warehouses
    const updatedWarehouses = await Warehouse.find();
    res.json(updatedWarehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new warehouse
router.post('/', async (req, res) => {
  const warehouse = new Warehouse({
    name: req.body.name,
    totalProducts: 0,
    stockCount: 0,
    description: req.body.description
  });

  try {
    const newWarehouse = await warehouse.save();
    res.status(201).json(newWarehouse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a warehouse
router.put('/:id', async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    warehouse.name = req.body.name;
    warehouse.description = req.body.description;

    const updatedWarehouse = await warehouse.save();
    // Update counts after saving
    await Warehouse.updateCounts(updatedWarehouse._id);
    
    // Fetch the updated warehouse with current counts
    const finalWarehouse = await Warehouse.findById(updatedWarehouse._id);
    res.json(finalWarehouse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a warehouse
router.delete('/:id', async (req, res) => {
  try {
    // Check if warehouse has products
    const productsCount = await Product.countDocuments({ warehouse: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete warehouse that contains products. Please move or delete the products first.' 
      });
    }

    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 