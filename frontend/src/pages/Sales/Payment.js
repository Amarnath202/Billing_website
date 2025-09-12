import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { format } from 'date-fns';
import { cashInHandsaAPI, cashInBanksaAPI, cashInChequesaAPI } from '../../services/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Payment = () => {
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [chequeTransactions, setChequeTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [chequeSearchQuery, setChequeSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    orderId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    customer: '',
    product: '',
    quantity: '',
    totalAmount: '',
    amountPaid: '',
    paymentType: 'Cash',
    accountNumber: '',
    paymentNote: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch data function using useCallback
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const [cashResponse, bankResponse, chequeResponse] = await Promise.all([
        cashInHandsaAPI.getAll(),
        cashInBanksaAPI.getAll(),
        cashInChequesaAPI.getAll()
      ]);
      setTransactions(cashResponse.data);
      setBankTransactions(bankResponse.data);
      setChequeTransactions(chequeResponse.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showSnackbar('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async () => {
    // Validate form data
    const errors = {};
    if (!formData.orderId) errors.orderId = 'Order ID is required';
    if (!formData.customer) errors.customer = 'Customer is required';
    if (!formData.totalAmount || formData.totalAmount <= 0) errors.totalAmount = 'Valid total amount is required';
    if (!formData.amountPaid || formData.amountPaid <= 0) errors.amountPaid = 'Valid amount paid is required';
    if (formData.amountPaid > formData.totalAmount) errors.amountPaid = 'Amount paid cannot exceed total amount';
    if (tabValue === 1 && !formData.accountNumber) errors.accountNumber = 'Account number is required for bank transactions';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const data = {
        orderId: formData.orderId,
        date: new Date(formData.date).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        customer: formData.customer,
        product: formData.product,
        quantity: parseFloat(formData.quantity),
        totalAmount: parseFloat(formData.totalAmount),
        amountPaid: parseFloat(formData.amountPaid),
        paymentType: formData.paymentType,
        paymentNote: formData.paymentNote
      };

      let api;
      switch (tabValue) {
        case 0:
          api = cashInHandsaAPI;
          break;
        case 1:
          api = cashInBanksaAPI;
          data.accountNumber = formData.accountNumber;
          break;
        case 2:
          api = cashInChequesaAPI;
          break;
        default:
          api = cashInHandsaAPI;
      }

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
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      orderId: transaction.orderId,
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(transaction.dueDate), 'yyyy-MM-dd'),
      customer: transaction.customer,
      product: transaction.product,
      quantity: transaction.quantity.toString(),
      totalAmount: transaction.totalAmount.toString(),
      amountPaid: transaction.amountPaid.toString(),
      accountNumber: transaction.accountNumber || '',
      paymentType: transaction.paymentType || 'Cash',
      paymentNote: transaction.paymentNote || ''
    });
    setIsEditing(true);
    setEditingTransaction(transaction);
    setOpenDialog(true);
  };

  const handleDelete = async (id, type = 'cash') => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        let api;
        switch (type) {
          case 'bank':
            api = cashInBanksaAPI;
            break;
          case 'cheque':
            api = cashInChequesaAPI;
            break;
          default:
            api = cashInHandsaAPI;
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
      customer: '',
      product: '',
      quantity: '',
      totalAmount: '',
      amountPaid: '',
      paymentType: 'Cash',
      accountNumber: '',
      paymentNote: ''
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

    return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
          Cash&Bank Management
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment tabs">
          <Tab 
            label="CASH IN HAND" 
            sx={{ 
              color: tabValue === 0 ? '#ff9f43' : 'inherit',
              fontWeight: tabValue === 0 ? 600 : 400,
              '&.Mui-selected': {
                color: '#ff9f43',
              }
            }} 
          />
          <Tab 
            label="CASH IN BANK" 
            sx={{ 
              color: tabValue === 1 ? '#ff9f43' : 'inherit',
              fontWeight: tabValue === 1 ? 600 : 400,
              '&.Mui-selected': {
                color: '#ff9f43',
              }
            }} 
          />
          <Tab 
            label="CASH IN CHEQUE" 
            sx={{ 
              color: tabValue === 2 ? '#ff9f43' : 'inherit',
              fontWeight: tabValue === 2 ? 600 : 400,
              '&.Mui-selected': {
                color: '#ff9f43',
              }
            }} 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search by Customer or Product..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: '300px' }}
          />
          
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Payment Type</TableCell>
                {tabValue === 1 && <TableCell>Account Number</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 1 ? 12 : 11} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 1 ? 12 : 11} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{transaction.orderId}</TableCell>
                    <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell>{transaction.product}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{transaction.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.amountPaid.toFixed(2)}</TableCell>
                    <TableCell>{(transaction.totalAmount - transaction.amountPaid).toFixed(2)}</TableCell>
                    <TableCell>{transaction.paymentType}</TableCell>
                    {tabValue === 1 && <TableCell>{transaction.accountNumber}</TableCell>}
                    <TableCell>
                      <IconButton onClick={() => handleEdit(transaction)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(transaction._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={transactions.length}
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search by Customer or Product..."
            variant="outlined"
            size="small"
            value={bankSearchQuery}
            onChange={(e) => setBankSearchQuery(e.target.value)}
            sx={{ width: '300px' }}
          />
          
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Payment Type</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : bankTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                bankTransactions
                  .filter(transaction => {
                    const searchTerm = bankSearchQuery.toLowerCase();
                    return (
                      transaction.customer.toLowerCase().includes(searchTerm) ||
                      transaction.product.toLowerCase().includes(searchTerm)
                    );
                  })
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.orderId}</TableCell>
                      <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.customer}</TableCell>
                      <TableCell sx={{ padding: '12px 8px', wordBreak: 'break-word' }}>{transaction.product}</TableCell>
                      <TableCell sx={{ padding: '12px 8px', textAlign: 'center' }}>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>{(transaction.totalAmount - transaction.amountPaid).toFixed(2)}</TableCell>
                      <TableCell>{transaction.paymentType}</TableCell>
                      <TableCell>{transaction.accountNumber}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(transaction)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(transaction._id, 'bank')} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={bankTransactions.filter(transaction => {
                const searchTerm = bankSearchQuery.toLowerCase();
                return (
                  transaction.customer.toLowerCase().includes(searchTerm) ||
                  transaction.product.toLowerCase().includes(searchTerm)
                );
              }).length}
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
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search by Customer or Product..."
            variant="outlined"
            size="small"
            value={chequeSearchQuery}
            onChange={(e) => setChequeSearchQuery(e.target.value)}
            sx={{ width: '300px' }}
          />
         
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Payment Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : chequeTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                chequeTransactions
                  .filter(transaction => {
                    const searchTerm = chequeSearchQuery.toLowerCase();
                    return (
                      transaction.customer.toLowerCase().includes(searchTerm) ||
                      transaction.product.toLowerCase().includes(searchTerm)
                    );
                  })
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{transaction.orderId}</TableCell>
                      <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{transaction.customer}</TableCell>
                      <TableCell>{transaction.product}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>{(transaction.totalAmount - transaction.amountPaid).toFixed(2)}</TableCell>
                      <TableCell>{transaction.paymentType}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(transaction)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(transaction._id, 'cheque')} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={chequeTransactions.filter(transaction => {
                const searchTerm = chequeSearchQuery.toLowerCase();
                return (
                  transaction.customer.toLowerCase().includes(searchTerm) ||
                  transaction.product.toLowerCase().includes(searchTerm)
                );
              }).length}
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
      </TabPanel>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
            <TextField
              name="orderId"
              label="Order ID"
              value={formData.orderId}
              onChange={handleInputChange}
              error={!!formErrors.orderId}
              helperText={formErrors.orderId}
              required
            />
            <TextField
              name="date"
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              name="dueDate"
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              name="customer"
              label="Customer"
              value={formData.customer}
              onChange={handleInputChange}
              error={!!formErrors.customer}
              helperText={formErrors.customer}
              required
            />
            <TextField
              name="product"
              label="Product"
              value={formData.product}
              onChange={handleInputChange}
              required
            />
            <TextField
              name="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
            <TextField
              name="totalAmount"
              label="Total Amount"
              type="number"
              value={formData.totalAmount}
              onChange={handleInputChange}
              error={!!formErrors.totalAmount}
              helperText={formErrors.totalAmount}
              required
            />
            <TextField
              name="amountPaid"
              label="Amount Paid"
              type="number"
              value={formData.amountPaid}
              onChange={handleInputChange}
              error={!!formErrors.amountPaid}
              helperText={formErrors.amountPaid}
              required
            />
            <FormControl>
              <InputLabel>Payment Type</InputLabel>
              <Select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                label="Payment Type"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Net Banking">Net Banking</MenuItem>
              </Select>
            </FormControl>
            {tabValue === 1 && (
              <TextField
                name="accountNumber"
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleInputChange}
                error={!!formErrors.accountNumber}
                helperText={formErrors.accountNumber}
                required
              />
            )}
            <TextField
              name="paymentNote"
              label="Payment Note"
              value={formData.paymentNote}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {isEditing ? 'Save Changes' : 'Add Transaction'}
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
};

export default Payment;
