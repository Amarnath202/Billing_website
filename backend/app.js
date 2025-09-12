require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const supplierRoutes = require('./routes/suppliers');
const accountPayableRoutes = require('./routes/accountPayable');
const accountReceivableRoutes = require('./routes/accountReceivable');
const purchaseRoutes = require('./routes/purchases');
const purchaseReturnsRouter = require('./routes/purchaseReturns');
const customerRoutes = require('./routes/customers');
const salesOrderRoutes = require('./routes/salesOrders');
const productRoutes = require('./routes/products');
const brandRoutes = require('./routes/brandRoutes');
const warehouseRoutes = require('./routes/warehouse');
const cashInHandphRoutes = require('./routes/cashInHandph');
const cashInHandsaRoutes = require('./routes/cashInHandsa');
const cashInBankphRoutes = require('./routes/cashInBankph');
const cashInBanksaRoutes = require('./routes/cashInBanksa');
const cashInChequesaRoutes = require('./routes/cashInChequesa');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const authRoutes = require('./routes/auth');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  next();
});

// Connect to MongoDB with improved error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  retryWrites: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  heartbeatFrequencyMS: 2000, // More frequent heartbeats
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1); // Exit if we can't connect to the database
});

// Add MongoDB connection error handler
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

// Add MongoDB disconnection handler
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

// Add MongoDB reconnection handler
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/account-payable', accountPayableRoutes);
app.use('/api/account-receivable', accountReceivableRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/purchase-returns', purchaseReturnsRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/cash-in-handph', cashInHandphRoutes);
app.use('/api/cash-in-handsa', cashInHandsaRoutes);
app.use('/api/cash-in-bankph', cashInBankphRoutes);
app.use('/api/cash-in-banksa', cashInBanksaRoutes);
app.use('/api/cash-in-chequesa', cashInChequesaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Debug route to list all registered routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push(`${Object.keys(handler.route.methods)} ${middleware.regexp} ${handler.route.path}`);
        }
      });
    }
  });
  res.json(routes);
});

// Catch-all route for debugging
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: err.message || 'An error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Registered routes:');
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      console.log(`Router base: ${middleware.regexp}`);
    }
  });
});

module.exports = app; 