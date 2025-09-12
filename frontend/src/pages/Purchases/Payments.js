import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Tabs, Tab, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert,
  Select, MenuItem, FormControl, InputLabel, TablePagination,
  Divider, FormHelperText
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { cashInHandphAPI, cashInBankphAPI, cashInChequephAPI, supplierAPI, productsAPI } from '../../services/api';
import { format } from 'date-fns';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function Payments() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [chequeSearchQuery, setChequeSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [chequeTransactions, setChequeTransactions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    orderId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    supplier: '',
    product: '',
    quantity: '',
    totalAmount: '',
    amountPaid: '',
    paymentType: 'Cash',
    accountNumber: '',
    paymentNote: '',
    chequeNumber: '',
    chequeDate: format(new Date(), 'yyyy-MM-dd'),
    bankName: '',
    chequeStatus: 'Pending'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bankPage, setBankPage] = useState(0);
  const [bankRowsPerPage, setBankRowsPerPage] = useState(10);
  const [chequePage, setChequePage] = useState(0);
  const [chequeRowsPerPage, setChequeRowsPerPage] = useState(10);

  const safeFormatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      showSnackbar('Error fetching suppliers', 'error');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      showSnackbar('Error fetching products', 'error');
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const [cashResponse, bankResponse, chequeResponse] = await Promise.all([
        cashInHandphAPI.getAll(),
        cashInBankphAPI.getAll(),
        cashInChequephAPI.getAll()
      ]);
      setTransactions(cashResponse.data);
      setBankTransactions(bankResponse.data);
      setChequeTransactions(chequeResponse.data);
    } catch (error) {
      showSnackbar('Error fetching transactions', 'error');
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchSuppliers();
    fetchProducts();
  }, [fetchTransactions, fetchSuppliers, fetchProducts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (value) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    // Validate form data
    const errors = {};
    if (!formData.orderId) errors.orderId = 'Order ID is required';
    if (!formData.supplier) errors.supplier = 'Supplier is required';
    if (!formData.product) errors.product = 'Product is required';
    if (!formData.quantity || formData.quantity < 1) errors.quantity = 'Valid quantity is required';
    if (!formData.totalAmount || formData.totalAmount <= 0) errors.totalAmount = 'Valid total amount is required';
    if (!formData.amountPaid || formData.amountPaid <= 0) errors.amountPaid = 'Valid amount paid is required';
    if (formData.amountPaid > formData.totalAmount) errors.amountPaid = 'Amount paid cannot exceed total amount';
    if (tabValue === 1 && !formData.accountNumber) errors.accountNumber = 'Account number is required for bank transactions';
    if (tabValue === 2) {
      if (!formData.chequeNumber) errors.chequeNumber = 'Cheque number is required';
      if (!formData.bankName) errors.bankName = 'Bank name is required';
      if (!formData.chequeDate) errors.chequeDate = 'Cheque date is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        orderId: formData.orderId,
        date: new Date(formData.date).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        supplier: formData.supplier,
        product: formData.product,
        quantity: parseFloat(formData.quantity),
        totalAmount: parseFloat(formData.totalAmount),
        amountPaid: parseFloat(formData.amountPaid),
        accountNumber: formData.accountNumber,
        paymentType: formData.paymentType,
        paymentNote: formData.paymentNote
      };

      // Add cheque-specific fields if it's a cheque transaction
      if (tabValue === 2) {
        data.chequeNumber = formData.chequeNumber;
        data.chequeDate = new Date(formData.chequeDate).toISOString();
        data.bankName = formData.bankName;
        data.chequeStatus = formData.chequeStatus;
      }

      const api = tabValue === 0 ? cashInHandphAPI : tabValue === 1 ? cashInBankphAPI : cashInChequephAPI;
      if (isEditing && editingTransaction) {
        await api.update(editingTransaction._id, data);
        showSnackbar('Transaction updated successfully', 'success');
      } else {
        await api.create(data);
        showSnackbar('Transaction added successfully', 'success');
      }

      setOpenDialog(false);
      fetchTransactions();
      resetForm();
    } catch (error) {
      showSnackbar(error.message || 'An error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      orderId: transaction.orderId,
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(transaction.dueDate), 'yyyy-MM-dd'),
      supplier: transaction.supplier,
      product: transaction.product,
      quantity: transaction.quantity.toString(),
      totalAmount: transaction.totalAmount.toString(),
      amountPaid: transaction.amountPaid.toString(),
      accountNumber: transaction.accountNumber || '',
      paymentType: transaction.paymentType || 'Cash',
      paymentNote: transaction.paymentNote || '',
      chequeNumber: transaction.chequeNumber || '',
      chequeDate: transaction.chequeDate ? format(new Date(transaction.chequeDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      bankName: transaction.bankName || '',
      chequeStatus: transaction.chequeStatus || 'Pending'
    });
    setIsEditing(true);
    setEditingTransaction(transaction);
    setOpenDialog(true);
  };

  const handleDelete = async (id, transactionType = 'cash') => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        let api;
        if (transactionType === 'bank') {
          api = cashInBankphAPI;
        } else if (transactionType === 'cheque') {
          api = cashInChequephAPI;
        } else {
          api = cashInHandphAPI;
        }
        await api.delete(id);
        fetchTransactions();
        showSnackbar('Transaction deleted successfully', 'success');
      } catch (error) {
        showSnackbar('Error deleting transaction', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      supplier: '',
      product: '',
      quantity: '',
      totalAmount: '',
      amountPaid: '',
      paymentType: 'Cash',
      accountNumber: '',
      paymentNote: '',
      chequeNumber: '',
      chequeDate: format(new Date(), 'yyyy-MM-dd'),
      bankName: '',
      chequeStatus: 'Pending'
    });
    setFormErrors({});
    setIsEditing(false);
    setEditingTransaction(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBankChangePage = (event, newPage) => {
    setBankPage(newPage);
  };

  const handleBankChangeRowsPerPage = (event) => {
    setBankRowsPerPage(parseInt(event.target.value, 10));
    setBankPage(0);
  };

  const handleChequeChangePage = (event, newPage) => {
    setChequePage(newPage);
  };

  const handleChequeChangeRowsPerPage = (event) => {
    setChequeRowsPerPage(parseInt(event.target.value, 10));
    setChequePage(0);
  };

  const renderTransactionSection = (title, searchQuery, setSearchQuery, data, transactionType = 'cash') => {
    const filteredData = data.filter(transaction =>
      transaction.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.product?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    let currentPage, currentRowsPerPage, handlePageChange, handleRowsPerPageChange;

    if (transactionType === 'bank') {
      currentPage = bankPage;
      currentRowsPerPage = bankRowsPerPage;
      handlePageChange = handleBankChangePage;
      handleRowsPerPageChange = handleBankChangeRowsPerPage;
    } else if (transactionType === 'cheque') {
      currentPage = chequePage;
      currentRowsPerPage = chequeRowsPerPage;
      handlePageChange = handleChequeChangePage;
      handleRowsPerPageChange = handleChequeChangeRowsPerPage;
    } else {
      currentPage = page;
      currentRowsPerPage = rowsPerPage;
      handlePageChange = handleChangePage;
      handleRowsPerPageChange = handleChangeRowsPerPage;
    }

    const paginatedData = filteredData.slice(
      currentPage * currentRowsPerPage,
      currentPage * currentRowsPerPage + currentRowsPerPage
    );

    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search by Supplier or Product..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: '300px' }}
          />
          
        </Box>

        <Paper sx={{ borderRadius: 1, overflow: 'hidden', width: '100%' }}>
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table sx={{ width: '100%', minWidth: 1000 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '10%', fontSize: '14px', fontWeight: 600 }}>ORDER ID</TableCell>
                  <TableCell sx={{ width: '8%', fontSize: '14px', fontWeight: 600 }}>DATE</TableCell>
                  <TableCell sx={{ width: '12%', fontSize: '14px', fontWeight: 600 }}>SUPPLIER</TableCell>
                  <TableCell sx={{ width: '12%', fontSize: '14px', fontWeight: 600 }}>PRODUCT</TableCell>
                  <TableCell sx={{ width: '8%', fontSize: '14px', fontWeight: 600 }}>QUANTITY</TableCell>
                  <TableCell sx={{ width: '10%', fontSize: '14px', fontWeight: 600 }}>TOTAL AMOUNT</TableCell>
                  <TableCell sx={{ width: '10%', fontSize: '14px', fontWeight: 600 }}>AMOUNT PAID</TableCell>
                  <TableCell sx={{ width: '8%', fontSize: '14px', fontWeight: 600 }}>BALANCE</TableCell>
                  <TableCell sx={{ width: '8%', fontSize: '14px', fontWeight: 600 }}>PAYMENT TYPE</TableCell>
                  {transactionType === 'bank' && (
                    <TableCell sx={{ width: '10%', fontSize: '14px', fontWeight: 600 }}>ACCOUNT NUMBER</TableCell>
                  )}
                  <TableCell sx={{ width: '8%', fontSize: '14px', fontWeight: 600 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((transaction) => (
                  <TableRow
                    key={transaction._id}
                    sx={{
                      '&:hover': { backgroundColor: '#f8f9fa' },
                      '&:nth-of-type(odd)': { backgroundColor: '#fff' },
                      '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' }
                    }}
                  >
                    <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.orderId}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{safeFormatDate(transaction.date)}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.supplier}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.product}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', textAlign: 'center' }}>{transaction.quantity}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', textAlign: 'right' }}>₹{transaction.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', textAlign: 'right' }}>₹{transaction.amountPaid?.toFixed(2)}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', textAlign: 'right' }}>
                      <Typography
                        sx={{
                          color: (transaction.totalAmount || 0) - (transaction.amountPaid || 0) > 0 ? '#ef4444' : '#22c55e',
                          fontWeight: 500
                        }}
                      >
                        ₹{((transaction.totalAmount || 0) - (transaction.amountPaid || 0)).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '12px 8px', textAlign: 'center' }}>{transaction.paymentType || 'Bank'}</TableCell>
                    {transactionType === 'bank' && (
                      <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.accountNumber}</TableCell>
                    )}
                    <TableCell sx={{ padding: '12px 8px', textAlign: 'center' }}>
                      <IconButton onClick={() => handleEdit(transaction)} sx={{ color: '#ff9f43', mr: 1, padding: '4px' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(transaction._id, transactionType)} sx={{ color: '#ef4444', padding: '4px' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
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
              }}
            />
          </TableContainer>
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
          Cash&Bank Management
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          TabIndicatorProps={{
            style: {
              backgroundColor: '#ff9f43'
            }
          }}
        >
          <Tab 
            label="Cash in Hand" 
            sx={{ 
              '&.Mui-selected': { 
                color: '#ff9f43',
                backgroundColor: '#fff8f0',
                fontWeight: 600
              }
            }}
          />
          <Tab
            label="Cash in Bank"
            sx={{
              '&.Mui-selected': {
                color: '#ff9f43',
                backgroundColor: '#fff8f0',
                fontWeight: 600
              }
            }}
          />
          <Tab
            label="Cash in Cheque"
            sx={{
              '&.Mui-selected': {
                color: '#ff9f43',
                backgroundColor: '#fff8f0',
                fontWeight: 600
              }
            }}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderTransactionSection(
          'Cash in Hand Transactions',
          searchQuery,
          setSearchQuery,
          transactions,
          'cash'
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderTransactionSection(
          'Cash in Bank Transactions',
          bankSearchQuery,
          setBankSearchQuery,
          bankTransactions,
          'bank'
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderTransactionSection(
          'Cash in Cheque Transactions',
          chequeSearchQuery,
          setChequeSearchQuery,
          chequeTransactions,
          'cheque'
        )}
      </TabPanel>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Order ID"
              name="orderId"
              value={formData.orderId}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!formErrors.orderId}
              helperText={formErrors.orderId}
            />
            <TextField
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Due Date"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                label="Supplier"
                error={!!formErrors.supplier}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier.name}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                label="Product"
                error={!!formErrors.product}
                required
              >
                {products.map((product) => (
                  <MenuItem key={product._id} value={product.name}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.product && (
                <FormHelperText error>{formErrors.product}</FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!formErrors.quantity}
              helperText={formErrors.quantity}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Total Amount"
              name="totalAmount"
              type="number"
              value={formData.totalAmount}
              onChange={handleInputChange}
              fullWidth
              error={!!formErrors.totalAmount}
              helperText={formErrors.totalAmount}
              inputProps={{ min: 0.01, step: "0.01" }}
            />
            <TextField
              label="Amount Paid"
              name="amountPaid"
              type="number"
              value={formData.amountPaid}
              onChange={handleInputChange}
              fullWidth
              error={!!formErrors.amountPaid}
              helperText={formErrors.amountPaid}
              inputProps={{ min: 0.01, step: "0.01" }}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                label="Payment Type"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
            {(tabValue === 1 || formData.paymentType === 'Bank') && (
              <TextField
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.accountNumber}
                helperText={formErrors.accountNumber}
                required={tabValue === 1}
              />
            )}
            {(tabValue === 2 || formData.paymentType === 'Cheque') && (
              <>
                <TextField
                  label="Cheque Number"
                  name="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.chequeNumber}
                  helperText={formErrors.chequeNumber}
                  required={tabValue === 2}
                />
                <TextField
                  label="Cheque Date"
                  type="date"
                  name="chequeDate"
                  value={formData.chequeDate}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.chequeDate}
                  helperText={formErrors.chequeDate}
                  required={tabValue === 2}
                />
                <TextField
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.bankName}
                  helperText={formErrors.bankName}
                  required={tabValue === 2}
                />
                <FormControl fullWidth>
                  <InputLabel>Cheque Status</InputLabel>
                  <Select
                    name="chequeStatus"
                    value={formData.chequeStatus}
                    onChange={handleInputChange}
                    label="Cheque Status"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Cleared">Cleared</MenuItem>
                    <MenuItem value="Bounced">Bounced</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            <TextField
              label="Payment Note"
              name="paymentNote"
              multiline
              rows={2}
              value={formData.paymentNote}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#ff9f43',
              '&:hover': {
                backgroundColor: '#ff9f43dd'
              }
            }}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Payments; 