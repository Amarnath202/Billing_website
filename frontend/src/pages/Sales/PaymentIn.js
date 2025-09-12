import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TablePagination,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {

  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { salesAPI } from '../../services/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5001'
});

const PaymentIn = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialog, setDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [formData, setFormData] = useState({
    totalAmount: '',
    amountPaid: '',
    paymentType: 'Cash',
    paymentNote: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [accountReceivables, setAccountReceivables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [receivableDialog, setReceivableDialog] = useState(false);
  const [receivableFormData, setReceivableFormData] = useState({
    customer: '',
    orderId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    amountPaid: '0',
    status: 'Pending'
  });
  const [isEditingReceivable, setIsEditingReceivable] = useState(false);
  const [editingReceivableId, setEditingReceivableId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccountReceivables();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

  const fetchAccountReceivables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/account-receivable');
      setAccountReceivables(response.data || []);
    } catch (error) {
      console.error('Error fetching account receivables:', error);
      toast.error('Failed to fetch account receivables');
      setAccountReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceivableDialogOpen = () => {
    setReceivableDialog(true);
  };

  const handleReceivableDialogClose = () => {
    setReceivableDialog(false);
    setReceivableFormData({
      customer: '',
      orderId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      amountPaid: '0',
      status: 'Pending'
    });
    setIsEditingReceivable(false);
    setEditingReceivableId(null);
  };

  const handleReceivableInputChange = (e) => {
    const { name, value } = e.target;
    setReceivableFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceivableSubmit = async () => {
    try {

      // Validate required fields
      if (!receivableFormData.customer) {
        toast.error('Please select a customer');
        return;
      }
      if (!receivableFormData.orderId?.trim()) {
        toast.error('Please enter an order ID');
        return;
      }
      if (!receivableFormData.date) {
        toast.error('Please select a date');
        return;
      }

      // Validate total amount
      const amount = parseFloat(receivableFormData.amount);
      if (!amount || amount <= 0) {
        toast.error('Total amount must be greater than 0');
        return;
      }

      // Validate amount paid
      const amountPaid = parseFloat(receivableFormData.amountPaid || '0');
      if (isNaN(amountPaid) || amountPaid < 0) {
        toast.error('Amount paid cannot be negative');
        return;
      }

      // Validate amount paid doesn't exceed total
      if (amountPaid > amount) {
        toast.error('Amount paid cannot exceed total amount');
        return;
      }

      // Calculate status based on payment
      let status;
      if (amountPaid >= amount) {
        status = 'Received';
      } else if (amountPaid > 0) {
        status = 'Partially Paid';
      } else {
        const today = new Date();
        const dueDate = new Date(receivableFormData.date);
        status = today > dueDate ? 'Overdue' : 'Pending';
      }

      const formDataToSend = {
        orderId: receivableFormData.orderId.trim(),
        invoiceNumber: receivableFormData.orderId.trim(), // Using orderId as invoiceNumber for now
        customer: receivableFormData.customer,
        date: new Date(receivableFormData.date).toISOString(),
        amount: amount,
        amountPaid: amountPaid,
        status: status
      };

      if (isEditingReceivable) {
        await api.put(`/api/account-receivable/${editingReceivableId}`, formDataToSend);
        toast.success('Account receivable updated successfully');
      } else {
        await api.post('/api/account-receivable', formDataToSend);
        toast.success('Account receivable added successfully');
      }
      fetchAccountReceivables();
      handleReceivableDialogClose();
    } catch (error) {
      console.error('Error saving account receivable:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save account receivable';
      toast.error(errorMessage);
    }
  };

  const handleEditReceivable = (receivable) => {
    setIsEditingReceivable(true);
    setEditingReceivableId(receivable._id);
    setReceivableFormData({
      customer: receivable.customer._id,
      orderId: receivable.orderId,
      date: format(new Date(receivable.date), 'yyyy-MM-dd'),
      amount: receivable.amount,
      amountPaid: receivable.amountPaid || '0',
      status: receivable.status
    });
    setReceivableDialog(true);
  };

  const handleDeleteReceivable = async (id) => {
    if (window.confirm('Are you sure you want to delete this receivable?')) {
      try {
        setLoading(true);
        await api.delete(`/api/account-receivable/${id}`);
        toast.success('Account receivable deleted successfully');
        await fetchAccountReceivables();
      } catch (error) {
        console.error('Error deleting account receivable:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete account receivable';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Add PDF generation
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Payment In Report', 14, 22);
      
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
      doc.text(filterText, 14, 30);

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

      // Prepare table data
      const tableColumn = ['Order ID', 'Customer', 'Date', 'Total Amount', 'Amount Paid', 'Balance', 'Status'];
      const tableRows = accountReceivables.map(receivable => [
        receivable?.orderId || '-',
        receivable?.customer?.name || '-',
        receivable?.date ? format(new Date(receivable.date), 'dd/MM/yyyy') : '-',
        `₹${(receivable?.amount || 0).toFixed(2)}`,
        `₹${(receivable?.amountPaid || 0).toFixed(2)}`,
        `₹${((receivable?.amount || 0) - (receivable?.amountPaid || 0)).toFixed(2)}`,
        receivable?.status || '-'
      ]);

      // Generate the table
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
      const grandTotal = accountReceivables.reduce((sum, item) => sum + (item?.amount || 0), 0);
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 40;
      doc.setFontSize(10);
      doc.setTextColor(255, 159, 67);
      doc.text(`Total Amount: ₹${grandTotal.toFixed(2)}`, 14, finalY + 10);

      // Save the PDF
      doc.save('payment-in-report.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  // Add Excel export
  const handleDownloadExcel = async () => {
    try {
      const response = await api.get('/api/account-receivable/download/excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payment-in.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Error downloading Excel file');
    }
  };

  // Filter receivables based on search term and date range with null checks
  const filteredReceivables = accountReceivables.filter(receivable => {
    const matchesSearch = (receivable?.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receivable?.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receivable?.status || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDateRange = true;
    if (fromDate && toDate) {
      const receivableDate = new Date(receivable.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      matchesDateRange = receivableDate >= from && receivableDate <= to;
    }

    return matchesSearch && matchesDateRange;
  });

  // View dialog handlers
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setDialog(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return '-';
    }
  };

  // Helper function to determine payment status
  const getStatus = (total, paid) => {
    if (!total || total === 0) return 'Invalid';
    const paidAmount = paid || 0;
    if (paidAmount >= total) return 'Paid';
    if (paidAmount > 0) return 'Partially Paid';
    return 'Unpaid';
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll();
      
      const enrichedSales = await Promise.all(response.data.map(async (sale) => {
        const totalPaid = sale.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const balance = sale.total - totalPaid;
        
        return {
          ...sale,
          totalPaid,
          balance,
          status: getStatus(sale.total, totalPaid)
        };
      }));

      setSales(enrichedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales records');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, fontSize: '2rem' }}>
            Payment In Management
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ORDER ID</TableCell>
                <TableCell>CUSTOMER</TableCell>
                <TableCell>DATE</TableCell>
                <TableCell>TOTAL AMOUNT</TableCell>
                <TableCell>AMOUNT PAID</TableCell>
                <TableCell>BALANCE</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress sx={{ color: '#ff9f43' }} />
                  </TableCell>
                </TableRow>
              ) : filteredReceivables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No payment records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceivables
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((receivable) => {
                    const amount = Number(receivable?.amount || 0);
                    const amountPaid = Number(receivable?.amountPaid || 0);
                    const balance = amount - amountPaid;
                    
                    return (
                      <TableRow 
                        key={receivable._id}
                        sx={{ 
                          '&:hover': { backgroundColor: '#f8f9fa' },
                          '&:nth-of-type(odd)': { backgroundColor: '#fff' },
                          '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' }
                        }}
                      >
                        <TableCell>{receivable?.orderId || '-'}</TableCell>
                        <TableCell>{receivable?.customer?.name || '-'}</TableCell>
                        <TableCell>{formatDate(receivable?.date)}</TableCell>
                        <TableCell>₹{amount.toFixed(2)}</TableCell>
                        <TableCell>₹{amountPaid.toFixed(2)}</TableCell>
                        <TableCell>₹{balance.toFixed(2)}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              backgroundColor: 
                                receivable.status === 'Paid' ? '#4caf50' :
                                receivable.status === 'Partially Paid' ? '#ff9f43' : '#f44336',
                              color: '#fff',
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              display: 'inline-block',
                              fontSize: '0.875rem'
                            }}
                          >
                            {receivable.status}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleViewSale(receivable)}
                            size="small"
                            sx={{ color: '#ff9f43' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && filteredReceivables.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredReceivables.length}
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
        )}
      </Paper>

      <Dialog open={receivableDialog} onClose={handleReceivableDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditingReceivable ? 'Edit Account Receivable' : 'Add Account Receivable'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Customer</InputLabel>
              <Select
                name="customer"
                value={receivableFormData.customer}
                onChange={handleReceivableInputChange}
                label="Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Order ID"
              name="orderId"
              value={receivableFormData.orderId}
              onChange={handleReceivableInputChange}
              error={Boolean(receivableFormData.orderId?.trim() === '')}
              helperText={
                receivableFormData.orderId?.trim() === '' ? 'Order ID is required' : ''
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="date"
              label="Date"
              name="date"
              value={receivableFormData.date}
              onChange={handleReceivableInputChange}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Total Amount"
              name="amount"
              value={receivableFormData.amount}
              onChange={handleReceivableInputChange}
              error={Boolean(receivableFormData.amount && parseFloat(receivableFormData.amount) <= 0)}
              helperText={
                receivableFormData.amount && parseFloat(receivableFormData.amount) <= 0
                  ? 'Total amount must be greater than 0'
                  : ''
              }
              inputProps={{ min: 0.01, step: "0.01" }}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Amount Paid"
              name="amountPaid"
              value={receivableFormData.amountPaid}
              onChange={handleReceivableInputChange}
              error={Boolean(
                receivableFormData.amountPaid && (
                  parseFloat(receivableFormData.amountPaid) < 0 ||
                  (receivableFormData.amount && 
                    parseFloat(receivableFormData.amountPaid) > parseFloat(receivableFormData.amount))
                )
              )}
              helperText={
                receivableFormData.amountPaid && parseFloat(receivableFormData.amountPaid) < 0
                  ? 'Amount paid cannot be negative'
                  : receivableFormData.amount && 
                    parseFloat(receivableFormData.amountPaid) > parseFloat(receivableFormData.amount)
                    ? 'Amount paid cannot exceed total amount'
                    : ''
              }
              inputProps={{ min: 0, step: "0.01" }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={receivableFormData.status}
                onChange={handleReceivableInputChange}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                <MenuItem value="Received">Received</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReceivableDialogClose}>Cancel</Button>
          <Button onClick={handleReceivableSubmit} variant="contained" color="primary">
            {isEditingReceivable ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            component="div" 
            variant="h6" 
            sx={{ color: '#ff9f43', fontWeight: 600 }}
          >
            Payment Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSale && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Order ID:</strong> {selectedSale.orderId || '-'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Date:</strong> {formatDate(selectedSale.date)}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Due Date:</strong> {formatDate(selectedSale.dueDate)}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Customer:</strong> {selectedSale.customer?.name || '-'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Customer Phone:</strong> {selectedSale.customer?.phone || '-'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Customer Email:</strong> {selectedSale.customer?.email || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Status:</strong>{' '}
                    <Box
                      component="span"
                      sx={{
                        backgroundColor: 
                          selectedSale.status === 'Paid' ? '#4caf50' :
                          selectedSale.status === 'Partially Paid' ? '#ff9f43' : '#f44336',
                        color: '#fff',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontSize: '0.875rem'
                      }}
                    >
                      {selectedSale.status}
                    </Box>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Payment Type:</strong> {selectedSale.payments?.[0]?.paymentType || '-'}
                  </Typography>
                  {selectedSale.payments?.[0]?.paymentType === 'Bank' && (
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Account Number:</strong> {selectedSale.payments?.[0]?.accountNumber || '-'}
                    </Typography>
                  )}
                  {selectedSale.payments?.[0]?.paymentType === 'Cheque' && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Cheque Number:</strong> {selectedSale.payments?.[0]?.chequeNumber || '-'}
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Bank Name:</strong> {selectedSale.payments?.[0]?.bankName || '-'}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Total Amount:</strong>{' '}
                    <Typography component="span" sx={{ color: '#2196f3' }}>
                      ₹{selectedSale.total?.toFixed(2) || '0.00'}
                    </Typography>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Amount Paid:</strong>{' '}
                    <Typography component="span" sx={{ color: '#4caf50' }}>
                      ₹{selectedSale.totalPaid?.toFixed(2) || '0.00'}
                    </Typography>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Balance:</strong>{' '}
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: selectedSale.balance > 0 ? '#f44336' : '#4caf50',
                        fontWeight: 'bold'
                      }}
                    >
                      ₹{selectedSale.balance?.toFixed(2) || '0.00'}
                    </Typography>
                  </Typography>
                </Grid>
                {selectedSale.payments?.[0]?.paymentNote && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Payment Note:</strong>
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedSale.payments[0].paymentNote}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialog(false)} 
            variant="contained" 
            sx={{
              backgroundColor: '#ff9f43',
              '&:hover': { backgroundColor: '#ff9f43dd' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentIn; 