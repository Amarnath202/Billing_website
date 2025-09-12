import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  TablePagination,
  FormHelperText,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const api = axios.create({
  baseURL: 'http://localhost:5001'
});

const SalesOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    customer: '',
    productId: '',
    product: '',
    warehouse: '',
    brand: '',
    category: '',
    productPrice: '',
    quantity: '',
    total: '',
    payment: {
      amount: '',
      paymentType: 'Cash',
      accountNumber: '',
      paymentNote: ''
    }
  });

  // Tax and Discount states
  const [selectedTax, setSelectedTax] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [taxRates] = useState([
    { id: 1, name: 'GST', percentage: 18, description: 'Goods and Services Tax' },
    { id: 2, name: 'VAT', percentage: 12, description: 'Value Added Tax' },
    { id: 3, name: 'No Tax', percentage: 0, description: 'No Tax Applied' }
  ]);
  const [discounts] = useState([
    { id: 1, name: 'Early Bird', type: 'percentage', value: 10, description: 'Early payment discount' },
    { id: 2, name: 'Bulk Order', type: 'fixed', value: 500, description: 'Discount for bulk orders' },
    { id: 3, name: 'No Discount', type: 'percentage', value: 0, description: 'No Discount Applied' }
  ]);

  useEffect(() => {
    fetchSalesOrders();
    fetchCustomers();
    fetchProducts();
    fetchWarehouses();
  }, []);

  // Recalculate total when tax or discount changes
  useEffect(() => {
    if (formData.productPrice && formData.quantity) {
      const price = parseFloat(formData.productPrice);
      const quantity = parseFloat(formData.quantity);
      if (!isNaN(price) && !isNaN(quantity)) {
        // Calculate subtotal first
        const subtotal = price * quantity;

        // Calculate tax amount
        let taxAmount = 0;
        if (selectedTax) {
          const taxRate = taxRates.find(tax => tax.id === selectedTax);
          if (taxRate) {
            taxAmount = (subtotal * taxRate.percentage) / 100;
          }
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (selectedDiscount) {
          const discount = discounts.find(disc => disc.id === selectedDiscount);
          if (discount) {
            if (discount.type === 'percentage') {
              discountAmount = (subtotal * discount.value) / 100;
            } else {
              discountAmount = discount.value;
            }
          }
        }

        // Calculate grand total and update form data
        const grandTotal = (subtotal + taxAmount - discountAmount).toFixed(2);
        setFormData(prev => ({
          ...prev,
          total: grandTotal
        }));
      }
    }
  }, [selectedTax, selectedDiscount, formData.productPrice, formData.quantity, taxRates, discounts]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to fetch warehouses');
    }
  };

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/sales-orders');
      setSalesOrders(response.data);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      setError('Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('payment.')) {
      const paymentField = name.split('.')[1];
      
      // Special handling for account number to ensure it only contains numbers
      if (paymentField === 'accountNumber' && value) {
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({
          ...prev,
          payment: {
            ...prev.payment,
            accountNumber: numericValue
          }
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          [paymentField]: value,
          // Clear account number when payment type changes to non-bank
          accountNumber: paymentField === 'paymentType' && value !== 'Bank' ? '' : 
                        paymentField === 'paymentType' ? prev.payment.accountNumber : 
                        prev.payment.accountNumber
        }
      }));
    } else {
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: value
        };

        // If product selection changes, auto-fill product details
        if (name === 'product') {
          const selectedProduct = products.find(p => p._id === value);
          if (selectedProduct) {
            newFormData.productId = selectedProduct.productId || '';
            newFormData.brand = selectedProduct.brand || '';
            newFormData.category = selectedProduct.category || '';
            newFormData.productPrice = selectedProduct.productPrice?.toString() || '';

            // Recalculate total if quantity exists
            if (newFormData.quantity) {
              const price = parseFloat(selectedProduct.productPrice);
              const quantity = parseFloat(newFormData.quantity);
              if (!isNaN(price) && !isNaN(quantity)) {
                // Calculate subtotal first
                const subtotal = price * quantity;

                // Calculate tax amount
                let taxAmount = 0;
                if (selectedTax) {
                  const taxRate = taxRates.find(tax => tax.id === selectedTax);
                  if (taxRate) {
                    taxAmount = (subtotal * taxRate.percentage) / 100;
                  }
                }

                // Calculate discount amount
                let discountAmount = 0;
                if (selectedDiscount) {
                  const discount = discounts.find(disc => disc.id === selectedDiscount);
                  if (discount) {
                    if (discount.type === 'percentage') {
                      discountAmount = (subtotal * discount.value) / 100;
                    } else {
                      discountAmount = discount.value;
                    }
                  }
                }

                // Calculate grand total
                newFormData.total = (subtotal + taxAmount - discountAmount).toFixed(2);
              }
            }
          }
        }

        // If quantity or product price changes, recalculate total
        if ((name === 'quantity' || name === 'productPrice') && newFormData.productPrice && newFormData.quantity) {
          const price = parseFloat(newFormData.productPrice);
          const quantity = parseFloat(newFormData.quantity);
          if (!isNaN(price) && !isNaN(quantity)) {
            // Calculate subtotal first
            const subtotal = price * quantity;

            // Calculate tax amount
            let taxAmount = 0;
            if (selectedTax) {
              const taxRate = taxRates.find(tax => tax.id === selectedTax);
              if (taxRate) {
                taxAmount = (subtotal * taxRate.percentage) / 100;
              }
            }

            // Calculate discount amount
            let discountAmount = 0;
            if (selectedDiscount) {
              const discount = discounts.find(disc => disc.id === selectedDiscount);
              if (discount) {
                if (discount.type === 'percentage') {
                  discountAmount = (subtotal * discount.value) / 100;
                } else {
                  discountAmount = discount.value;
                }
              }
            }

            // Calculate grand total
            newFormData.total = (subtotal + taxAmount - discountAmount).toFixed(2);
          }
        }

        return newFormData;
      });
    }

    // Reset validation errors
    setError(null);
  };

  // Tax and Discount calculation functions
  const calculateSubtotal = () => {
    const price = parseFloat(formData.productPrice) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    return price * quantity;
  };

  const calculateTaxAmount = () => {
    if (!selectedTax) return 0;
    const taxRate = taxRates.find(tax => tax.id === selectedTax);
    if (!taxRate) return 0;
    return (calculateSubtotal() * taxRate.percentage) / 100;
  };

  const calculateDiscountAmount = () => {
    if (!selectedDiscount) return 0;
    const discount = discounts.find(disc => disc.id === selectedDiscount);
    if (!discount) return 0;

    if (discount.type === 'percentage') {
      return (calculateSubtotal() * discount.value) / 100;
    } else {
      return discount.value;
    }
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = calculateTaxAmount();
    const discountAmount = calculateDiscountAmount();
    return subtotal + taxAmount - discountAmount;
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.customer) {
        toast.error('Please select a customer');
        return;
      }
      if (!formData.product) {
        toast.error('Please select a product');
        return;
      }
      if (!formData.warehouse) {
        toast.error('Please select a warehouse');
        return;
      }
      if (!formData.quantity || formData.quantity < 1) {
        toast.error('Please enter a valid quantity');
        return;
      }
      if (!formData.date) {
        toast.error('Please select a date');
        return;
      }
      if (!formData.dueDate) {
        toast.error('Please select a due date');
        return;
      }
      if (!formData.total || parseFloat(formData.total) <= 0) {
        toast.error('Please enter a valid total amount');
        return;
      }
      if (!formData.payment.amount || parseFloat(formData.payment.amount) < 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }
      if (!formData.payment.paymentType) {
        toast.error('Please select a payment type');
        return;
      }

      // Validate bank account number
      if (formData.payment.paymentType === 'Bank') {
        if (!formData.payment.accountNumber?.trim()) {
          toast.error('Account number is required for bank payments');
          return;
        }
        if (formData.payment.accountNumber.trim().length < 8) {
          toast.error('Account number must be at least 8 characters long');
          return;
        }
      }

      // Validate payment amount doesn't exceed total
      if (parseFloat(formData.payment.amount) > parseFloat(formData.total)) {
        toast.error('Payment amount cannot exceed total amount');
        return;
      }

      // Format data for backend
      const salesOrderData = {
        date: new Date(formData.date).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        customer: formData.customer,
        product: formData.product,
        warehouse: formData.warehouse,
        quantity: parseInt(formData.quantity),
        total: parseFloat(formData.total),
        paymentAmount: parseFloat(formData.payment.amount),
        paymentType: formData.payment.paymentType,
        accountNumber: formData.payment.paymentType === 'Bank' ? formData.payment.accountNumber.trim() : '',
        paymentNote: formData.payment.paymentNote || '',
        status: parseFloat(formData.payment.amount) >= parseFloat(formData.total) ? 'Completed' : 'Pending'
      };

      let response;
      if (selectedOrder) {
        // Update existing order
        response = await api.put(`/api/sales-orders/${selectedOrder._id}`, salesOrderData);
        toast.success('Sales order updated successfully');
      } else {
        // Create new order
        response = await api.post('/api/sales-orders', salesOrderData);
        toast.success('Sales order created successfully');
      }

      console.log('Sales order operation completed:', response.data);
      handleCloseDialog();
      fetchSalesOrders();
      resetForm();
    } catch (error) {
      console.error('Error with sales order operation:', error);
      toast.error(error.response?.data?.message || 'Failed to process sales order');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await api.delete(`/api/sales-orders/${id}`);
        toast.success('Sales order deleted successfully');
        fetchSalesOrders();
      } catch (error) {
        console.error('Error deleting sales order:', error);
        toast.error('Failed to delete sales order');
      }
    }
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setFormData({
      date: format(new Date(order.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(order.dueDate), 'yyyy-MM-dd'),
      customer: order.customer._id,
      product: order.product._id,
      warehouse: order.warehouse._id,
      productId: order.product._id,
      brand: order.product.brand,
      category: order.product.category,
      productPrice: order.total / order.quantity,
      quantity: order.quantity.toString(),
      total: order.total.toString(),
      payment: {
        amount: order.paymentAmount.toString(),
        paymentType: order.paymentType,
        accountNumber: order.accountNumber || '',
        paymentNote: order.paymentNote || ''
      }
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setSelectedTax('');
    setSelectedDiscount('');
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      customer: '',
      product: '',
      warehouse: '',
      productId: '',
      brand: '',
      category: '',
      productPrice: '',
      quantity: '',
      total: '',
      payment: {
        amount: '',
        paymentType: 'Cash',
        accountNumber: '',
        paymentNote: ''
      }
    });
  };

  const handleViewOpen = (order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredSalesOrders = salesOrders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDateRange = true;
    if (fromDate && toDate) {
      const orderDate = new Date(order.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      matchesDateRange = orderDate >= from && orderDate <= to;
    }

    return matchesSearch && matchesDateRange;
  });

  const paginatedSalesOrders = filteredSalesOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Sales Orders Report', 14, 22);

      // Add filters info
      doc.setFontSize(11);
      doc.setTextColor(100);
      let filterText = 'Filters: ';
      if (fromDate && toDate) {
        filterText += `Date Range: ${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`;
      }
      if (searchTerm) {
        filterText += ` | Search: ${searchTerm}`;
      }
      if (!fromDate && !toDate && !searchTerm) {
        filterText += 'None';
      }
      doc.text(filterText, 14, 32);

      // Prepare table data
      const tableColumn = [
        'Order ID', 'Date', 'Customer', 'Product', 'Category',
        'Warehouse', 'Quantity', 'Total', 'Payment', 'Status'
      ];

      const tableRows = [];
      filteredSalesOrders.forEach(order => {
        const balance = order.total - (order.paymentAmount || 0);
        const status = balance <= 0 ? 'Paid' : balance === order.total ? 'Pending' : 'Partially Paid';

        const orderData = [
          order.orderNumber || '-',
          format(new Date(order.date), 'dd/MM/yyyy'),
          order.customer?.name || '-',
          order.product?.name || '-',
          order.product?.category || '-',
          order.warehouse?.name || '-',
          order.quantity?.toString() || '0',
          `₹${order.total?.toFixed(2) || '0.00'}`,
          `₹${(order.paymentAmount || 0).toFixed(2)}`,
          status
        ];
        tableRows.push(orderData);
      });

      // Generate the table using the autoTable plugin
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [255, 159, 67],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Add total at the bottom
      const totalAmount = filteredSalesOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 40;
      doc.setFontSize(10);
      doc.setTextColor(255, 159, 67);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, finalY + 10);

      // Save the PDF
      doc.save(`sales-orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredSalesOrders.map(order => {
        const balance = order.total - (order.paymentAmount || 0);
        const status = balance <= 0 ? 'Paid' : balance === order.total ? 'Pending' : 'Partially Paid';

        return {
          'Order ID': order.orderNumber || '',
          'Date': order.date ? format(new Date(order.date), 'dd/MM/yyyy') : '',
          'Customer': order.customer?.name || '',
          'Customer Email': order.customer?.email || '',
          'Customer Phone': order.customer?.phone || '',
          'Product': order.product?.name || '',
          'Product Brand': order.product?.brand || '',
          'Product Category': order.product?.category || '',
          'Product ID': order.product?.productId || '',
          'Warehouse': order.warehouse?.name || '',
          'Quantity': order.quantity || 0,
          'Unit Price': order.product?.productPrice || 0,
          'Total Amount': order.total || 0,
          'Payment Amount': order.paymentAmount || 0,
          'Payment Type': order.paymentType || '',
          'Account Number': order.accountNumber || '',
          'Balance': balance,
          'Status': status,
          'Payment Note': order.paymentNote || ''
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Orders');

      // Save the Excel file
      XLSX.writeFile(wb, `sales-orders-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      toast.error('Error generating Excel file');
    }
  };

  // Add resetForm function
  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      customer: '',
      productId: '',
      product: '',
      warehouse: '',
      brand: '',
      category: '',
      productPrice: '',
      quantity: '',
      total: '',
      payment: {
        amount: '',
        paymentType: 'Cash',
        accountNumber: '',
        paymentNote: ''
      }
    });
    setSelectedTax('');
    setSelectedDiscount('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, fontSize: '2rem' }}>
            Sales Order Management
          </Typography>

          {/* Date Filter Section - Right Side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: '150px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#ff9f43',
                  },
                  '&:hover fieldset': {
                    borderColor: '#f39c12',
                  },
                },
              }}
            />
            <TextField
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: '150px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#ff9f43',
                  },
                  '&:hover fieldset': {
                    borderColor: '#f39c12',
                  },
                },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSearchTerm('');
              }}
              sx={{
                borderColor: '#ff9f43',
                color: '#ff9f43',
                '&:hover': {
                  borderColor: '#f39c12',
                  backgroundColor: '#fff3e0',
                },
                whiteSpace: 'nowrap'
              }}
            >
              CLEAR FILTERS
            </Button>
          </Box>
        </Box>

        {/* Search Bar and Action Buttons - Below Filter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: '300px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#ff9f43',
                },
                '&:hover fieldset': {
                  borderColor: '#f39c12',
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleDownloadPDF}
              startIcon={<FaFilePdf />}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadExcel}
              startIcon={<FaFileExcel />}
            >
              EXCEL
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#f39c12',
                },
              }}
            >
              ADD ORDER
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ORDER ID</TableCell>
                <TableCell>DATE</TableCell>
                <TableCell>CUSTOMER</TableCell>
                <TableCell>PRODUCT</TableCell>
                <TableCell>CATEGORY</TableCell>
                <TableCell>WAREHOUSE</TableCell>
                <TableCell>QUANTITY</TableCell>
                <TableCell>TOTAL</TableCell>
                <TableCell>PAYMENT</TableCell>
                <TableCell>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#ff9f43' }} />
                  </TableCell>
                </TableRow>
              ) : paginatedSalesOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                    No sales orders found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSalesOrders.map((order) => {
                  const balance = order.total - (order.paymentAmount || 0);
                  const status = balance <= 0 ? 'Paid' : balance === order.total ? 'Pending' : 'Partially Paid';
                  
                  return (
                    <TableRow
                      key={order._id}
                      sx={{
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <TableCell>{order.orderNumber || '-'}</TableCell>
                      <TableCell>{format(new Date(order.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{order.customer?.name || '-'}</TableCell>
                      <TableCell>{order.product?.name || '-'}</TableCell>
                      <TableCell>{order.product?.category || 'N/A'}</TableCell>
                      <TableCell>{order.warehouse?.name || '-'}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>₹{order.total.toFixed(2)}</TableCell>
                      <TableCell>₹{(order.paymentAmount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewOpen(order)}
                          size="small"
                          sx={{ color: '#4299e1', mr: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleEdit(order)}
                          size="small"
                          sx={{ color: '#ff9f43', mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(order._id)}
                          size="small"
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredSalesOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-select': {
                  color: '#ff9f43',
                },
                '.MuiTablePagination-selectIcon': {
                  color: '#ff9f43',
                },
                '.MuiTablePagination-displayedRows': {
                  color: '#666',
                },
                '.MuiTablePagination-actions': {
                  '.MuiIconButton-root': {
                    color: '#ff9f43',
                    '&.Mui-disabled': {
                      color: '#ffd5a8',
                    },
                  },
                },
              }}
            />
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          {selectedOrder ? 'Edit Sales Order' : 'Add New Sales Order'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Order Number"
              value={selectedOrder ? selectedOrder.orderNumber : 'Will be auto-generated'}
              disabled
              sx={{ mb: 2 }}
              helperText="Order number will be automatically generated in format: SO-YYMMDD-XXX"
            />

            <TextField
              fullWidth
              type="date"
              label="Date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="date"
              label="Due Date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Customer</InputLabel>
              <Select
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                label="Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
              {!formData.customer && (
                <FormHelperText error>Customer is required</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Product</InputLabel>
              <Select
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                label="Product"
              >
                {products.map((product) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
              {!formData.product && (
                <FormHelperText error>Product is required</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Warehouse</InputLabel>
              <Select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleInputChange}
                label="Warehouse"
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
              {!formData.warehouse && (
                <FormHelperText error>Warehouse is required</FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Brand"
              name="brand"
              value={formData.brand}
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Product Price"
              name="productPrice"
              type="number"
              value={formData.productPrice}
              disabled
              sx={{ mb: 2 }}
              inputProps={{ min: 0.01, step: "0.01" }}
            />

            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              error={Boolean(!formData.quantity || parseInt(formData.quantity) <= 0)}
              helperText={
                !formData.quantity
                  ? 'Quantity is required'
                  : parseInt(formData.quantity) <= 0
                    ? 'Quantity must be greater than 0'
                    : ''
              }
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />

            {/* Tax and Discount Selection */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Tax</InputLabel>
                <Select
                  value={selectedTax}
                  onChange={(e) => setSelectedTax(e.target.value)}
                  label="Select Tax"
                >
                  <MenuItem value="">No Tax</MenuItem>
                  {taxRates.map((tax) => (
                    <MenuItem key={tax.id} value={tax.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2">{tax.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {tax.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${tax.percentage}%`}
                          size="small"
                          sx={{
                            backgroundColor: '#ff9f43',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Select Discount</InputLabel>
                <Select
                  value={selectedDiscount}
                  onChange={(e) => setSelectedDiscount(e.target.value)}
                  label="Select Discount"
                >
                  <MenuItem value="">No Discount</MenuItem>
                  {discounts.map((discount) => (
                    <MenuItem key={discount.id} value={discount.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2">{discount.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {discount.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                          size="small"
                          sx={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Calculation Summary */}
            {(formData.productPrice && formData.quantity) && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #dee2e6' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#495057' }}>
                  Calculation Summary:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">₹{calculateSubtotal().toFixed(2)}</Typography>
                </Box>
                {selectedTax && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      Tax ({taxRates.find(t => t.id === selectedTax)?.percentage || 0}%):
                    </Typography>
                    <Typography variant="body2">₹{calculateTaxAmount().toFixed(2)}</Typography>
                  </Box>
                )}
                {selectedDiscount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2">-₹{calculateDiscountAmount().toFixed(2)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Grand Total:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{calculateGrandTotal().toFixed(2)}</Typography>
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              label="Total Amount"
              name="total"
              type="number"
              value={formData.total}
              InputProps={{
                readOnly: true,
              }}
              helperText="Total is calculated automatically including tax and discount"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }}>Payment Details</Divider>

            <TextField
              fullWidth
              label="Payment Amount"
              name="payment.amount"
              type="number"
              value={formData.payment.amount}
              onChange={handleInputChange}
              error={Boolean(formData.payment.amount && parseFloat(formData.payment.amount) <= 0)}
              helperText={
                formData.payment.amount && parseFloat(formData.payment.amount) <= 0 
                  ? 'Payment amount must be greater than 0' 
                  : ''
              }
              inputProps={{ min: 0.01, step: "0.01" }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Type</InputLabel>
              <Select
                name="payment.paymentType"
                value={formData.payment.paymentType}
                onChange={handleInputChange}
                label="Payment Type"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>

            {formData.payment.paymentType === 'Bank' && (
              <TextField
                fullWidth
                label="Account Number"
                name="payment.accountNumber"
                value={formData.payment.accountNumber}
                onChange={handleInputChange}
                required
                error={!formData.payment.accountNumber?.trim()}
                helperText={!formData.payment.accountNumber?.trim() ? 'Account number is required for bank payments' : ''}
                sx={{ mb: 2 }}
                inputProps={{
                  maxLength: 20,
                  pattern: "[0-9]*"
                }}
                placeholder="Enter bank account number"
              />
            )}

            <TextField
              fullWidth
              label="Payment Note"
              name="payment.paymentNote"
              value={formData.payment.paymentNote}
              onChange={handleInputChange}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: '#ff9f43', borderColor: '#ff9f43' }}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            sx={{ 
              backgroundColor: '#ff9f43',
              '&:hover': {
                backgroundColor: '#f39c12',
              },
            }}
          >
            {selectedOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={handleViewClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          View Sales Order Details
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ '& > *': { my: 2 } }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ff9f43', mb: 1, fontWeight: 'bold' }}>Order Information</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Order ID:</strong> {selectedOrder.orderNumber}</Typography>
                  <Typography><strong>Date:</strong> {format(new Date(selectedOrder.date), 'dd/MM/yyyy')}</Typography>
                  <Typography><strong>Due Date:</strong> {format(new Date(selectedOrder.dueDate), 'dd/MM/yyyy')}</Typography>
                  <Typography><strong>Customer:</strong> {selectedOrder.customer?.name || 'N/A'}</Typography>
                  <Typography><strong>Warehouse:</strong> {selectedOrder.warehouse?.name || 'N/A'}</Typography>
                  <Typography><strong>Status:</strong> {selectedOrder.paymentAmount >= selectedOrder.total ? 'Paid' : 'Pending'}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#ff9f43' }} />

              <Box>
                <Typography variant="h6" sx={{ color: '#ff9f43', mb: 1, fontWeight: 'bold' }}>Product Details</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Product:</strong> {selectedOrder.product?.name || 'N/A'}</Typography>
                  <Typography><strong>Brand:</strong> {selectedOrder.product?.brand || 'N/A'}</Typography>
                  <Typography><strong>Category:</strong> {selectedOrder.product?.category || 'N/A'}</Typography>
                  <Typography><strong>Quantity:</strong> {selectedOrder.quantity}</Typography>
                  <Typography><strong>Total Amount:</strong> ₹{selectedOrder.total.toFixed(2)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#ff9f43' }} />

              <Box>
                <Typography variant="h6" sx={{ color: '#ff9f43', mb: 1, fontWeight: 'bold' }}>Payment Details</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Payment Amount:</strong> ₹{(selectedOrder.paymentAmount || 0).toFixed(2)}</Typography>
                  <Typography><strong>Payment Type:</strong> {selectedOrder.paymentType || '-'}</Typography>
                  {selectedOrder.paymentType === 'Bank' && (
                    <Typography><strong>Account Number:</strong> {selectedOrder.accountNumber || '-'}</Typography>
                  )}
                  <Typography><strong>Payment Note:</strong> {selectedOrder.paymentNote || '-'}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose} sx={{ color: '#ff9f43', borderColor: '#ff9f43' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SalesOrder; 