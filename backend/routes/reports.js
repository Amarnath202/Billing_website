const express = require('express');
const router = express.Router();
const SalesOrder = require('../models/SalesOrder');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const SalesReturn = require('../models/SalesReturn');
const PurchaseReturn = require('../models/PurchaseReturn');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// GET /api/reports/profit-loss - Get profit and loss report
router.get('/profit-loss', async (req, res) => {
  try {
    const { fromDate, toDate, warehouse } = req.query;
    
    // Set default date range if not provided
    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1); // Start of year
    const endDate = toDate ? new Date(toDate) : new Date(); // Today
    
    console.log('Generating P&L report for:', { startDate, endDate, warehouse });

    // Build date filter
    const dateFilter = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add warehouse filter if specified (warehouse is ObjectId)
    const warehouseFilter = warehouse ? { warehouse: warehouse } : {};

    // Calculate financial data from main business transactions
    const [
      salesOrderData,
      salesReturnsData,
      purchaseData,
      purchaseReturnsData,
      expenseData
    ] = await Promise.all([
      // Sales from SalesOrder (main sales transactions)
      SalesOrder.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),

      // Sales returns (negative impact on revenue)
      SalesReturn.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),

      // Purchase costs (main purchase transactions)
      Purchase.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),

      // Purchase returns (reduce purchase costs)
      PurchaseReturn.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),

      // Operating expenses (from expense list) - include all except rejected
      Expense.aggregate([
        { $match: { ...dateFilter, status: { $ne: 'Rejected' } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    // Calculate totals from main business transactions
    const salesOrderTotal = salesOrderData[0]?.total || 0;
    const salesReturnsTotal = salesReturnsData[0]?.total || 0;
    const purchaseTotal = purchaseData[0]?.total || 0;
    const purchaseReturnsTotal = purchaseReturnsData[0]?.total || 0;
    const expenseTotal = expenseData[0]?.total || 0;

    // Calculate gross sales (from sales orders)
    const grossSales = salesOrderTotal;

    // Calculate net sales (gross sales - sales returns)
    const netSales = grossSales - salesReturnsTotal;

    // Calculate cost of goods sold (purchases - purchase returns)
    const costOfGoodsSold = purchaseTotal - purchaseReturnsTotal;

    // Calculate gross profit (net sales - cost of goods sold)
    const grossProfit = netSales - costOfGoodsSold;

    // Calculate net profit (gross profit - operating expenses)
    const netProfit = grossProfit - expenseTotal;

    // Prepare response data in the format expected by the frontend
    const reportData = [
      {
        transactionType: 'Sale Without Tax (+)',
        totalAmount: salesOrderTotal
      },
      {
        transactionType: 'Sale Return Without Tax (-)',
        totalAmount: salesReturnsTotal
      },
      {
        transactionType: 'Purchase Without Tax (-)',
        totalAmount: purchaseTotal
      },
      {
        transactionType: 'Purchase Return Without Tax (+)',
        totalAmount: purchaseReturnsTotal
      },
      {
        transactionType: 'Expense without Tax (-)',
        totalAmount: expenseTotal
      }
    ];

    const summary = {
      grossSales,
      salesReturns: salesReturnsTotal,
      netSales,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses: expenseTotal,
      netProfit
    };

    // Get warehouse name if warehouse filter is applied
    let warehouseName = 'All Warehouses';
    if (warehouse) {
      try {
        const warehouseDoc = await Warehouse.findById(warehouse);
        warehouseName = warehouseDoc ? warehouseDoc.name : 'Unknown Warehouse';
      } catch (error) {
        console.error('Error fetching warehouse name:', error);
        warehouseName = 'Unknown Warehouse';
      }
    }

    res.json({
      success: true,
      data: reportData,
      summary,
      filters: {
        fromDate: startDate,
        toDate: endDate,
        warehouse: warehouseName
      }
    });

  } catch (error) {
    console.error('Error generating profit and loss report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating profit and loss report',
      error: error.message
    });
  }
});

// GET /api/reports/balance-sheet - Get balance sheet data
router.get('/balance-sheet', async (req, res) => {
  try {
    const { fromDate, toDate, warehouse } = req.query;
    
    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = toDate ? new Date(toDate) : new Date();
    
    const dateFilter = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const warehouseFilter = warehouse ? { warehouse: warehouse } : {};

    // Get financial data for balance sheet from main business transactions
    const [salesData, salesReturnsData, purchaseData, purchaseReturnsData, expenseData] = await Promise.all([
      // Total sales from sales orders
      SalesOrder.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Sales returns
      SalesReturn.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Total purchases from purchase orders
      Purchase.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Purchase returns
      PurchaseReturn.aggregate([
        { $match: { ...dateFilter, ...warehouseFilter } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Total expenses from expense list - include all except rejected
      Expense.aggregate([
        { $match: { ...dateFilter, status: { $ne: 'Rejected' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalSales = salesData[0]?.total || 0;
    const totalSalesReturns = salesReturnsData[0]?.total || 0;
    const totalPurchases = purchaseData[0]?.total || 0;
    const totalPurchaseReturns = purchaseReturnsData[0]?.total || 0;
    const totalExpenses = expenseData[0]?.total || 0;

    // Calculate net sales and cost of goods sold
    const netSales = totalSales - totalSalesReturns;
    const costOfGoodsSold = totalPurchases - totalPurchaseReturns;
    const grossProfit = netSales - costOfGoodsSold;
    const netSummary = grossProfit - totalExpenses;

    const balanceSheetData = [
      {
        transactionType: 'Sale Without Tax (+)',
        totalAmount: totalSales
      },
      {
        transactionType: 'Sale Return Without Tax (-)',
        totalAmount: totalSalesReturns
      },
      {
        transactionType: 'Purchase Without Tax (-)',
        totalAmount: totalPurchases
      },
      {
        transactionType: 'Purchase Return Without Tax (+)',
        totalAmount: totalPurchaseReturns
      },
      {
        transactionType: 'Expense without Tax (-)',
        totalAmount: totalExpenses
      }
    ];

    // Get warehouse name if warehouse filter is applied
    let warehouseName = 'All Warehouses';
    if (warehouse) {
      try {
        const warehouseDoc = await Warehouse.findById(warehouse);
        warehouseName = warehouseDoc ? warehouseDoc.name : 'Unknown Warehouse';
      } catch (error) {
        console.error('Error fetching warehouse name:', error);
        warehouseName = 'Unknown Warehouse';
      }
    }

    res.json({
      success: true,
      data: balanceSheetData,
      summary: {
        netSummary,
        grossProfit,
        netSales,
        costOfGoodsSold,
        totalExpenses,
        grossProfitDetails: {
          salePrice: totalSales,
          salesReturns: totalSalesReturns,
          netSales: netSales,
          averagePurchasePrice: totalPurchases,
          purchaseReturns: totalPurchaseReturns,
          costOfGoodsSold: costOfGoodsSold
        }
      },
      filters: {
        fromDate: startDate,
        toDate: endDate,
        warehouse: warehouseName
      }
    });

  } catch (error) {
    console.error('Error generating balance sheet report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating balance sheet report',
      error: error.message
    });
  }
});

// GET /api/reports/purchase-report - Generate purchase report
router.get('/purchase-report', async (req, res) => {
  try {
    const { startDate, endDate, supplier } = req.query;

    console.log('Purchase Report Query:', { startDate, endDate, supplier });

    // Build date filter - more flexible approach
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        dateFilter.date.$lt = endDateObj;
      }
    }

    // Build supplier filter
    const supplierFilter = supplier ? { supplier: supplier } : {};

    console.log('Filters applied:', { dateFilter, supplierFilter });

    // Get purchase orders with populated supplier and product data
    const purchases = await Purchase.find({
      ...dateFilter,
      ...supplierFilter
    })
    .populate('supplier', 'name')
    .populate('product', 'name')
    .sort({ date: -1 });

    console.log(`Found ${purchases.length} purchase orders`);

    // Calculate totals
    const totalGrandTotal = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const totalPaidAmount = purchases.reduce((sum, purchase) => {
      const paidAmount = purchase.payments?.reduce((paySum, payment) => paySum + payment.amount, 0) || 0;
      return sum + paidAmount;
    }, 0);
    const totalBalance = totalGrandTotal - totalPaidAmount;

    // Format data for frontend
    const reportData = purchases.map(purchase => {
      const paidAmount = purchase.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      return {
        _id: purchase._id,
        date: purchase.date,
        orderId: purchase.orderId,
        supplier: purchase.supplier?.name || 'Unknown Supplier',
        product: purchase.product?.name || 'Unknown Product',
        quantity: purchase.quantity,
        grandTotal: purchase.total,
        paidAmount: paidAmount,
        balance: purchase.total - paidAmount,
        status: purchase.balance > 0 ? 'Pending' : 'Paid'
      };
    });

    res.json({
      success: true,
      data: reportData,
      summary: {
        totalRecords: purchases.length,
        totalGrandTotal,
        totalPaidAmount,
        totalBalance
      },
      filters: {
        startDate,
        endDate,
        supplier: supplier ? purchases[0]?.supplier?.name : 'All Suppliers'
      }
    });

  } catch (error) {
    console.error('Error generating purchase report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating purchase report'
    });
  }
});

// GET /api/reports/sales-report - Generate sales report
router.get('/sales-report', async (req, res) => {
  try {
    const { startDate, endDate, customer } = req.query;

    console.log('Sales Report Query:', { startDate, endDate, customer });

    // Build date filter - more flexible approach
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        dateFilter.date.$lt = endDateObj;
      }
    }

    // Build customer filter
    const customerFilter = customer ? { customer: customer } : {};

    console.log('Filters applied:', { dateFilter, customerFilter });

    // Get sales orders with populated customer and product data
    const salesOrders = await SalesOrder.find({
      ...dateFilter,
      ...customerFilter
    })
    .populate('customer', 'name')
    .populate('product', 'name')
    .sort({ date: -1 });

    console.log(`Found ${salesOrders.length} sales orders`);

    // Calculate totals
    const totalGrandTotal = salesOrders.reduce((sum, order) => sum + order.total, 0);
    const totalPaidAmount = salesOrders.reduce((sum, order) => sum + (order.paymentAmount || 0), 0);
    const totalBalance = totalGrandTotal - totalPaidAmount;

    // Format data for frontend
    const reportData = salesOrders.map(order => {
      const paidAmount = order.paymentAmount || 0;
      const balance = order.total - paidAmount;
      return {
        _id: order._id,
        date: order.date,
        orderId: order.orderNumber,
        customer: order.customer?.name || 'Unknown Customer',
        product: order.product?.name || 'Unknown Product',
        quantity: order.quantity,
        grandTotal: order.total,
        paidAmount: paidAmount,
        balance: balance,
        status: balance <= 0 ? 'Paid' : 'Pending'
      };
    });

    res.json({
      success: true,
      data: reportData,
      summary: {
        totalRecords: salesOrders.length,
        totalGrandTotal,
        totalPaidAmount,
        totalBalance
      },
      filters: {
        startDate,
        endDate,
        customer: customer ? salesOrders[0]?.customer?.name : 'All Customers'
      }
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report'
    });
  }
});

// GET /api/reports/expense-report - Generate expense report
router.get('/expense-report', async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    console.log('Expense Report Query:', { startDate, endDate, category });

    // Build date filter - more flexible approach
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        dateFilter.date.$lt = endDateObj;
      }
    }

    // Build additional filters
    const additionalFilters = {};
    if (category) additionalFilters.category = category;

    // Combine all filters
    const filters = { ...dateFilter, ...additionalFilters };

    console.log('Filters applied:', filters);

    // Get expenses with filters
    const expenses = await Expense.find(filters)
      .sort({ date: -1, createdAt: -1 });

    console.log(`Found ${expenses.length} expenses`);

    // Calculate summary
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRecords = expenses.length;

    // Group by status for additional insights
    const statusBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + expense.amount;
      return acc;
    }, {});

    // Group by payment type for additional insights
    const paymentTypeBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.paymentType] = (acc[expense.paymentType] || 0) + expense.amount;
      return acc;
    }, {});

    // Format data for frontend
    const reportData = expenses.map(expense => ({
      _id: expense._id,
      date: expense.date,
      expenseNumber: expense.expenseNumber,
      category: expense.category,
      amount: expense.amount,
      paymentType: expense.paymentType,
      description: expense.description || '',
      vendor: expense.vendor || '',
      reference: expense.reference || '',
      status: expense.status
    }));

    res.json({
      success: true,
      data: reportData,
      summary: {
        totalRecords,
        totalAmount,
        statusBreakdown,
        paymentTypeBreakdown
      },
      filters: {
        startDate,
        endDate,
        category: category || 'All Categories'
      }
    });

  } catch (error) {
    console.error('Error generating expense report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating expense report'
    });
  }
});

// GET /api/reports/product-report - Generate product report
router.get('/product-report', async (req, res) => {
  try {
    const { category, brand, warehouse } = req.query;

    console.log('Product Report Query:', { category, brand, warehouse });

    // Build filters
    const filters = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (warehouse) filters.warehouse = warehouse;

    console.log('Filters applied:', filters);

    // Get products with populated warehouse data
    const products = await Product.find(filters)
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 });

    console.log(`Found ${products.length} products`);

    // Calculate totals
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalValue = products.reduce((sum, product) => sum + (product.productPrice * product.stock), 0);
    const lowStockProducts = products.filter(product => product.stock < 10).length;

    // Format data for frontend
    const reportData = products.map(product => ({
      _id: product._id,
      productId: product.productId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      productPrice: product.productPrice,
      stock: product.stock,
      warehouse: product.warehouse?.name || 'Unknown Warehouse',
      stockValue: product.productPrice * product.stock,
      stockStatus: product.stock < 10 ? 'Low Stock' : product.stock === 0 ? 'Out of Stock' : 'In Stock'
    }));

    res.json({
      success: true,
      data: reportData,
      summary: {
        totalProducts,
        totalStock,
        totalValue,
        lowStockProducts
      },
      filters: {
        category: category || 'All Categories',
        brand: brand || 'All Brands',
        warehouse: warehouse ? products[0]?.warehouse?.name : 'All Warehouses'
      }
    });

  } catch (error) {
    console.error('Error generating product report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating product report'
    });
  }
});

module.exports = router;
