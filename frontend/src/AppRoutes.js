import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Layout Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Auth Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// Main Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Contacts/Customers';
import Suppliers from './pages/Contacts/Suppliers';
import Billing from './pages/Sales/Billing';
import Barcode from './pages/Sales/Barcode';
import SalesHistory from './pages/Sales/SalesHistory';
import PaymentIn from './pages/Sales/PaymentIn';
import SalesOrder from './pages/Sales/SalesOrder';
import Payment from './pages/Sales/Payment';
import SalesReturn from './pages/Sales/SalesReturn';
import PaymentOut from './pages/Purchases/PaymentOut';
import PurchaseOrder from './pages/Purchases/PurchaseOrder';
import Payments from './pages/Purchases/Payments';
import PurchaseReturn from './pages/Purchases/PurchaseReturn';
import Products from './pages/Items/Products';
import Brands from './pages/Items/Brands';
import Categories from './pages/Items/Categories';
import Warehouses from './pages/Warehouses/Warehouses';
import ExpenseList from './pages/Expenses/ExpenseList';
import ProfitLoss from './pages/Reports/ProfitLoss';
import PurchaseReport from './pages/Reports/PurchaseReport';
import SalesReport from './pages/Reports/SalesReport';
import ProductReport from './pages/Reports/ProductReport';
import ExpenseReport from './pages/Reports/ExpenseReport';
import Email from './pages/Email/Email';
import EmailHistory from './pages/Email/EmailHistory';
import AppSettings from './pages/Settings/AppSettings';
import Profile from './pages/Users/Profile';
import UsersList from './pages/Users/UsersList';
import Roles from './pages/Users/Roles';
import TaxRates from './pages/OtherSettings/TaxRates';
import Discount from './pages/OtherSettings/Discount';

// Dashboard Layout Component
const DashboardLayout = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header />
    <Box sx={{ display: 'flex', flex: 1 }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          padding: '20px', 
          backgroundColor: 'transparent', 
          overflowY: 'auto',
          marginTop: '64px' // Height of the header
        }}
      >
        {children}
      </Box>
    </Box>
    <Footer />
  </Box>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
      
      {/* Contacts */}
      <Route path="/customers" element={<DashboardLayout><Customers /></DashboardLayout>} />
      <Route path="/suppliers" element={<DashboardLayout><Suppliers /></DashboardLayout>} />
      
      {/* Sales */}
      <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
      <Route path="/barcode" element={<DashboardLayout><Barcode /></DashboardLayout>} />
      <Route path="/sales-history" element={<DashboardLayout><SalesHistory /></DashboardLayout>} />
      <Route path="/payment-in" element={<DashboardLayout><PaymentIn /></DashboardLayout>} />
      <Route path="/sales-order" element={<DashboardLayout><SalesOrder /></DashboardLayout>} />
      <Route path="/payment" element={<DashboardLayout><Payment /></DashboardLayout>} />
      <Route path="/sales-return" element={<DashboardLayout><SalesReturn /></DashboardLayout>} />
      
      {/* Purchases */}
      <Route path="/payment-out" element={<DashboardLayout><PaymentOut /></DashboardLayout>} />
      <Route path="/purchase-order" element={<DashboardLayout><PurchaseOrder /></DashboardLayout>} />
      <Route path="/payments" element={<DashboardLayout><Payments /></DashboardLayout>} />
      <Route path="/purchase-return" element={<DashboardLayout><PurchaseReturn /></DashboardLayout>} />
      
      {/* Items */}
      <Route path="/products" element={<DashboardLayout><Products /></DashboardLayout>} />
      <Route path="/brands" element={<DashboardLayout><Brands /></DashboardLayout>} />
      <Route path="/categories" element={<DashboardLayout><Categories /></DashboardLayout>} />
      
      {/* Warehouses */}
      <Route path="/warehouses" element={<DashboardLayout><Warehouses /></DashboardLayout>} />
      
      {/* Expenses */}
      <Route path="/expenses" element={<DashboardLayout><ExpenseList /></DashboardLayout>} />
      
      {/* Reports */}
      <Route path="/reports/profit-loss" element={<DashboardLayout><ProfitLoss /></DashboardLayout>} />
      <Route path="/reports/purchase" element={<DashboardLayout><PurchaseReport /></DashboardLayout>} />
      <Route path="/reports/sales" element={<DashboardLayout><SalesReport /></DashboardLayout>} />
      <Route path="/reports/product" element={<DashboardLayout><ProductReport /></DashboardLayout>} />
      <Route path="/reports/expense" element={<DashboardLayout><ExpenseReport /></DashboardLayout>} />
      
      {/* Email */}
      <Route path="/email" element={<DashboardLayout><Email /></DashboardLayout>} />
      <Route path="/email-history" element={<DashboardLayout><EmailHistory /></DashboardLayout>} />
      
      {/* Settings */}
      <Route path="/settings" element={<DashboardLayout><AppSettings /></DashboardLayout>} />
      <Route path="/users/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
      <Route path="/users/list" element={<DashboardLayout><UsersList /></DashboardLayout>} />
      <Route path="/users/roles" element={<DashboardLayout><Roles /></DashboardLayout>} />
      <Route path="/tax-rates" element={<DashboardLayout><TaxRates /></DashboardLayout>} />
      <Route path="/discount" element={<DashboardLayout><Discount /></DashboardLayout>} />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes; 