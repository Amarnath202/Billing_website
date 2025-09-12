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
  TablePagination,
  Alert,
  IconButton,
  Grid,
  Divider
} from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { purchaseAPI, accountPayableAPI } from '../../services/api';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import AddIcon from '@mui/icons-material/Add';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

const PaymentOut = () => {
  // State management
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialog, setDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formData, setFormData] = useState({
    totalAmount: '',
    amountPaid: '',
    paymentType: 'Cash',
    paymentNote: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [error] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await purchaseAPI.getAll();
      
      const enrichedPurchases = await Promise.all(response.data.map(async (purchase) => {
        const totalPaid = purchase.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const balance = purchase.total - totalPaid;
        
        return {
          ...purchase,
          totalPaid,
          balance,
          status: getStatus(purchase.total, totalPaid)
        };
      }));

      setPurchases(enrichedPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchase records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper functions
  const getStatus = (total, paid) => {
    if (paid >= total) return 'Paid';
    if (paid > 0) return 'Partially Paid';
    return 'Unpaid';
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter and pagination
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateRange = true;
    if (fromDate && toDate) {
      const purchaseDate = new Date(purchase.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      matchesDateRange = purchaseDate >= from && purchaseDate <= to;
    }

    return matchesSearch && matchesDateRange;
  });

  const paginatedPurchases = filteredPurchases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Export functions
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Payment Out Report', 14, 22);

      // Add filters info
      doc.setFontSize(11);
      doc.setTextColor(100);
      let filterText = 'Filters: ';
      if (fromDate && toDate) {
        filterText += `Date Range: ${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`;
      }
      if (searchQuery) {
        filterText += ` | Search: ${searchQuery}`;
      }
      if (!fromDate && !toDate && !searchQuery) {
        filterText += 'None';
      }
      doc.text(filterText, 14, 30);

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

      const tableColumn = ['Order ID', 'Supplier', 'Date', 'Total Amount', 'Amount Paid', 'Balance', 'Status'];
      const tableRows = [];

      filteredPurchases.forEach(purchase => {
        const purchaseData = [
          purchase.orderId || 'N/A',
          purchase.supplier?.name || 'N/A',
          format(new Date(purchase.date), 'dd/MM/yyyy'),
          `₹${purchase.total?.toFixed(2) || '0.00'}`,
          `₹${purchase.totalPaid?.toFixed(2) || '0.00'}`,
          `₹${((purchase.total || 0) - (purchase.totalPaid || 0)).toFixed(2)}`,
          purchase.status
        ];
        tableRows.push(purchaseData);
      });

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
      const grandTotal = filteredPurchases.reduce((sum, item) => sum + (item?.total || 0), 0);
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 40;
      doc.setFontSize(10);
      doc.setTextColor(255, 159, 67);
      doc.text(`Total Amount: ₹${grandTotal.toFixed(2)}`, 14, finalY + 10);

      doc.save(`payment-out-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredPurchases.map(purchase => ({
        'Order ID': purchase.orderId || '',
        'Supplier': purchase.supplier?.name || '',
        'Supplier Email': purchase.supplier?.email || '',
        'Supplier Phone': purchase.supplier?.phone || '',
        'Date': purchase.date ? format(new Date(purchase.date), 'dd/MM/yyyy') : '',
        'Total Amount': purchase.total || 0,
        'Amount Paid': purchase.totalPaid || 0,
        'Balance': (purchase.total || 0) - (purchase.totalPaid || 0),
        'Status': purchase.status || '',
        'Payment Type': purchase.payments?.[purchase.payments.length - 1]?.paymentType || '',
        'Payment Note': purchase.payments?.[purchase.payments.length - 1]?.paymentNote || ''
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Out');

      // Save the Excel file
      XLSX.writeFile(wb, `payment-out-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      toast.error('Error generating Excel file');
    }
  };

  // Dialog handlers
  const handleEditClick = (purchase) => {
    setSelectedPurchase(purchase);
    setFormData({
      totalAmount: purchase.total.toString(),
      amountPaid: purchase.totalPaid.toString(),
      paymentType: purchase.payments?.[purchase.payments.length - 1]?.paymentType || 'Cash',
      paymentNote: purchase.payments?.[purchase.payments.length - 1]?.paymentNote || ''
    });
    setDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const totalAmount = parseFloat(formData.totalAmount);
      const amountPaid = parseFloat(formData.amountPaid);

      if (isNaN(totalAmount) || totalAmount <= 0) {
        toast.error('Please enter a valid total amount');
        return;
      }

      if (isNaN(amountPaid) || amountPaid < 0) {
        toast.error('Please enter a valid amount paid');
        return;
      }

      if (amountPaid > totalAmount) {
        toast.error('Amount paid cannot exceed the total amount');
        return;
      }

      // Update purchase with new values
      await purchaseAPI.update(selectedPurchase._id, {
        ...selectedPurchase,
        total: totalAmount,
        payments: [
          ...(selectedPurchase.payments || []),
          {
            amount: amountPaid - (selectedPurchase.totalPaid || 0),
            paymentType: formData.paymentType,
            paymentNote: formData.paymentNote,
            date: new Date().toISOString()
          }
        ]
      });

      // Update account payable record
      await accountPayableAPI.update(selectedPurchase._id, {
        totalAmount,
        amountPaid
      });

      toast.success('Payment updated successfully');
      setDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  const handleDeleteClick = async (purchase) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await purchaseAPI.delete(purchase._id);
        toast.success('Payment record deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast.error('Failed to delete payment record');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, fontSize: '2rem' }}>
            Payment Out Management
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
              onClick={exportToPDF}
              startIcon={<FaFilePdf />}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={exportToExcel}
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
                <TableCell>SUPPLIER</TableCell>
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
              ) : paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                  <TableRow
                    key={purchase._id}
                    sx={{
                      '&:hover': { backgroundColor: '#f8f9fa' },
                      '&:nth-of-type(odd)': { backgroundColor: '#fff' },
                      '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' }
                    }}
                  >
                    <TableCell>{purchase.orderId || '-'}</TableCell>
                    <TableCell>{purchase.supplier?.name || '-'}</TableCell>
                    <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>₹{purchase.total?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>₹{purchase.totalPaid?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>₹{((purchase.total || 0) - (purchase.totalPaid || 0)).toFixed(2)}</TableCell>
                    <TableCell>{purchase.status}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditClick(purchase)}
                        size="small"
                        sx={{ color: '#ff9f43', mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No payment records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && filteredPurchases.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPurchases.length}
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
          {selectedPurchase && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Order ID:</strong> {selectedPurchase.orderId || '-'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Date:</strong> {format(new Date(selectedPurchase.date), 'dd/MM/yyyy')}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Due Date:</strong> {format(new Date(selectedPurchase.dueDate), 'dd/MM/yyyy')}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Supplier:</strong> {selectedPurchase.supplier?.name || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Product:</strong> {selectedPurchase.product?.name || '-'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Quantity:</strong> {selectedPurchase.quantity || '-'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Payment Type:</strong> {selectedPurchase.payments?.[0]?.paymentType || '-'}
                  </Typography>
                  {selectedPurchase.payments?.[0]?.paymentType === 'Bank' && (
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Account Number:</strong> {selectedPurchase.payments?.[0]?.accountNumber || '-'}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Total Amount:</strong>{' '}
                    <Typography component="span" sx={{ color: '#2196f3' }}>
                      ₹{selectedPurchase.total?.toFixed(2) || '0.00'}
                    </Typography>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Amount Paid:</strong>{' '}
                    <Typography component="span" sx={{ color: '#4caf50' }}>
                      ₹{selectedPurchase.totalPaid?.toFixed(2) || '0.00'}
                    </Typography>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Balance:</strong>{' '}
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: ((selectedPurchase.total || 0) - (selectedPurchase.totalPaid || 0)) > 0 ? '#f44336' : '#4caf50',
                        fontWeight: 'bold'
                      }}
                    >
                      ₹{((selectedPurchase.total || 0) - (selectedPurchase.totalPaid || 0)).toFixed(2)}
                    </Typography>
                  </Typography>
                </Grid>
                {selectedPurchase.payments?.[0]?.paymentNote && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Payment Note:</strong>
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedPurchase.payments[0].paymentNote}
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

export default PaymentOut;
