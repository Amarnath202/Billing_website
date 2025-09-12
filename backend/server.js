const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');

const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const salesRoutes = require('./routes/sales');
const purchasesRouter = require('./routes/purchases');
const accountPayableRoutes = require('./routes/accountPayable');
const accountReceivableRoutes = require('./routes/accountReceivable');
const cashInHandphRoutes = require('./routes/cashInHandph');
const cashInBankphRoutes = require('./routes/cashInBankph');
const cashInChequephRoutes = require('./routes/cashInChequeph');
const cashInHandsaRoutes = require('./routes/cashInHandsa');
const cashInBanksaRoutes = require('./routes/cashInBanksa');
const cashInChequesaRoutes = require('./routes/cashInChequesa');
const purchaseReturnsRouter = require('./routes/purchaseReturns');
const customerRoutes = require('./routes/customers');
const salesOrderRoutes = require('./routes/salesOrders');
const salesReturnsRouter = require('./routes/salesReturns');
const brandRoutes = require('./routes/brandRoutes');
const warehouseRoutes = require('./routes/warehouse');
const emailRoutes = require('./routes/email');
const categoryRoutes = require('./routes/categories');
const migrationRoutes = require('./routes/migration');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const barcodeRoutes = require('./routes/barcode');
const roleRoutes = require('./routes/roles');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
  // Log collections
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
    } else {
      console.log('Available collections:', collections.map(c => c.name));
    }
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// MongoDB Connection Events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
    // Log database name
    console.log('Database:', mongoose.connection.db.databaseName);
});

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Billing System API' });
});

// Test route to check if server is responding
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRouter);
app.use('/api/account-payable', accountPayableRoutes);
app.use('/api/account-receivable', accountReceivableRoutes);
app.use('/api/cash-in-handph', cashInHandphRoutes);
app.use('/api/cash-in-bankph', cashInBankphRoutes);
app.use('/api/cash-in-chequeph', cashInChequephRoutes);
app.use('/api/cash-in-handsa', cashInHandsaRoutes);
app.use('/api/cash-in-banksa', cashInBanksaRoutes);
app.use('/api/cash-in-chequesa', cashInChequesaRoutes);
app.use('/api/purchase-returns', purchaseReturnsRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/sales-returns', salesReturnsRouter);
app.use('/api/brands', brandRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Debug route to list all registered routes
app.get('/api/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push(`${Object.keys(handler.route.methods)} ${handler.route.path}`);
                }
            });
        }
    });
    res.json(routes);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.url} not found` });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    // Log all registered routes
    console.log('\nRegistered Routes:');
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
            console.log(`Router mounted at: ${middleware.regexp}`);
        }
    });
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please choose a different port.`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

module.exports = app; 