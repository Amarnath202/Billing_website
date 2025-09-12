import React, { useState, useEffect } from 'react';
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
  IconButton,
  Grid,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { purchaseReturnAPI, purchaseAPI } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PurchaseReturn = () => {
  // State management
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialog, setDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [purchases, setPurchases] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    orderId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    supplier: '',
    product: '',
    quantity: '',
    total: '',
    paymentAmount: '',
    paymentType: 'Cash',
    reason: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchReturns();
    fetchPurchases();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await purchaseReturnAPI.getAll();
      setReturns(response.data);
    } catch (error) {
      console.error('Error fetching returns:', error);
      setError('Failed to load return records');
      toast.error('Failed to load return records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await purchaseAPI.getAll();
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchase records');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'orderId') {
      const selectedPurchase = purchases.find(purchase => purchase.orderId === value);
      if (selectedPurchase) {
        setFormData(prev => ({
          ...prev,
          orderId: value,
          supplier: selectedPurchase.supplier?._id || '',
          product: selectedPurchase.product?._id || '',
          total: selectedPurchase.total || 0,
          paymentAmount: selectedPurchase.total || 0,
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedReturn) {
        await purchaseReturnAPI.update(selectedReturn._id, formData);
        toast.success('Purchase return updated successfully');
      } else {
        await purchaseReturnAPI.create(formData);
        toast.success('Purchase return created successfully');
      }
      setDialog(false);
      fetchReturns();
    } catch (error) {
      console.error('Error saving purchase return:', error);
      toast.error(error.response?.data?.message || 'Failed to save purchase return');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!id) {
        toast.error('Invalid purchase return ID');
        return;
      }

      if (window.confirm('Are you sure you want to delete this purchase return?')) {
        setLoading(true);
        await purchaseReturnAPI.delete(id);
        toast.success('Purchase return deleted successfully');
        await fetchReturns(); // Refresh the list after deletion
      }
    } catch (error) {
      console.error('Error deleting purchase return:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete purchase return';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter returns based on search query and date range
  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.returnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateRange = true;
    if (fromDate && toDate) {
      const returnDate = new Date(ret.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      matchesDateRange = returnDate >= from && returnDate <= to;
    }

    return matchesSearch && matchesDateRange;
  });

  const paginatedReturns = filteredReturns.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View dialog handlers
  const handleViewOpen = (returnItem) => {
    setSelectedReturn(returnItem);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedReturn(null);
  };

  // Download handlers
  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Purchase Returns Report', 14, 22);

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
      doc.text(filterText, 14, 32);

      // Prepare table data
      const tableColumn = [
        'Return ID', 'Order ID', 'Date', 'Supplier', 'Product',
        'Quantity', 'Total', 'Payment', 'Status'
      ];

      const tableRows = [];
      filteredReturns.forEach(returnItem => {
        const balance = returnItem.total - (returnItem.paymentAmount || 0);
        const status = balance <= 0 ? 'Paid' : balance === returnItem.total ? 'Pending' : 'Partially Paid';

        const returnData = [
          returnItem.returnId || '-',
          returnItem.orderId || '-',
          format(new Date(returnItem.date), 'dd/MM/yyyy'),
          returnItem.supplier?.name || '-',
          returnItem.product?.name || '-',
          returnItem.quantity?.toString() || '0',
          `₹${returnItem.total?.toFixed(2) || '0.00'}`,
          `₹${(returnItem.paymentAmount || 0).toFixed(2)}`,
          status
        ];
        tableRows.push(returnData);
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
      const totalAmount = filteredReturns.reduce((sum, returnItem) => sum + (returnItem.total || 0), 0);
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 40;
      doc.setFontSize(10);
      doc.setTextColor(255, 159, 67);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, finalY + 10);

      // Save the PDF
      doc.save(`purchase-returns-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredReturns.map(returnItem => {
        const balance = returnItem.total - (returnItem.paymentAmount || 0);
        const status = balance <= 0 ? 'Paid' : balance === returnItem.total ? 'Pending' : 'Partially Paid';

        return {
          'Return ID': returnItem.returnId || '',
          'Order ID': returnItem.orderId || '',
          'Date': returnItem.date ? format(new Date(returnItem.date), 'dd/MM/yyyy') : '',
          'Due Date': returnItem.dueDate ? format(new Date(returnItem.dueDate), 'dd/MM/yyyy') : '',
          'Supplier': returnItem.supplier?.name || '',
          'Product': returnItem.product?.name || '',
          'Product Brand': returnItem.product?.brand || '',
          'Quantity': returnItem.quantity || 0,
          'Total Amount': returnItem.total || 0,
          'Payment Amount': returnItem.paymentAmount || 0,
          'Payment Type': returnItem.paymentType || '',
          'Balance': balance,
          'Status': status,
          'Reason': returnItem.reason || '',
          'Return Status': returnItem.status || 'Pending'
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Returns');

      // Save the Excel file
      XLSX.writeFile(wb, `purchase-returns-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      toast.error('Error generating Excel file');
    }
  };

  // Add this function to calculate status based on due date and payment
  const calculateStatus = (returnItem) => {
    const balance = returnItem.total - (returnItem.paymentAmount || 0);
    const dueDate = new Date(returnItem.dueDate);
    const today = new Date();

    if (balance <= 0) {
      return {
        label: 'Paid',
        color: '#4caf50' // Green
      };
    }

    if (today > dueDate) {
      return {
        label: 'Overdue',
        color: '#f44336' // Red
      };
    }

    return {
      label: 'Pending',
      color: '#ff9800' // Orange
    };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, fontSize: '2rem' }}>
            Purchase Return Management
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search returns..."
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedReturn(null);
                setFormData({
                  orderId: '',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  dueDate: format(new Date(), 'yyyy-MM-dd'),
                  supplier: '',
                  product: '',
                  quantity: '',
                  total: '',
                  paymentAmount: '',
                  paymentType: 'Cash',
                  reason: '',
                  status: 'Pending'
                });
                setDialog(true);
              }}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#f39c12',
                },
              }}
            >
              ADD RETURN
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
              <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>RETURN ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>ORDER ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>DUE DATE</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>SUPPLIER</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>PRODUCT</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>QUANTITY</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>TOTAL</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>PAYMENT</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <CircularProgress sx={{ color: '#ff9f43' }} />
                  </TableCell>
                </TableRow>
              ) : paginatedReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    No purchase returns found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReturns.map((returnItem) => {
                  const status = calculateStatus(returnItem);

                  return (
                    <TableRow
                      key={returnItem._id}
                      sx={{
                        backgroundColor: '#ffffff',
                        '&:hover': { backgroundColor: '#fff3e0' }
                      }}
                    >
                      <TableCell>{returnItem.returnId || '-'}</TableCell>
                      <TableCell>{returnItem.orderId || '-'}</TableCell>
                      <TableCell>{format(new Date(returnItem.dueDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{returnItem.supplier?.name || '-'}</TableCell>
                      <TableCell>{returnItem.product?.name || '-'}</TableCell>
                      <TableCell>{returnItem.quantity}</TableCell>
                      <TableCell>₹{returnItem.total.toFixed(2)}</TableCell>
                      <TableCell>₹{(returnItem.paymentAmount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            color: 'white',
                            backgroundColor: status.color
                          }}
                        >
                          {status.label}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewOpen(returnItem)}
                          size="small"
                          sx={{ color: '#ff9f43', mr: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setFormData({
                              ...returnItem,
                              dueDate: format(new Date(returnItem.dueDate), 'yyyy-MM-dd'),
                              supplier: returnItem.supplier?._id,
                              product: returnItem.product?._id
                            });
                            setDialog(true);
                          }}
                          size="small"
                          sx={{ color: '#ff9f43', mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(returnItem._id)}
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
          {!loading && filteredReturns.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredReturns.length}
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
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          {selectedReturn ? 'Edit Purchase Return' : 'Create Purchase Return'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Order ID</InputLabel>
              <Select
                name="orderId"
                value={formData.orderId}
                onChange={handleInputChange}
                label="Order ID"
              >
                {purchases.map((purchase) => (
                  <MenuItem key={purchase._id} value={purchase.orderId}>
                    {purchase.orderId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Total Amount"
              name="total"
              type="number"
              value={formData.total}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="Payment Amount"
              name="paymentAmount"
              type="number"
              value={formData.paymentAmount}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
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
            <TextField
              label="Reason for Return"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
        <Button onClick={() => setDialog(false)} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#ff9f43',
              '&:hover': { backgroundColor: '#ff9f43dd' }
            }}
          >
            {selectedReturn ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleViewClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          Purchase Return Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedReturn && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Return ID</Typography>
                  <Typography variant="body1">{selectedReturn.returnId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1">{selectedReturn.orderId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">{format(new Date(selectedReturn.date), 'dd/MM/yyyy')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">{format(new Date(selectedReturn.dueDate), 'dd/MM/yyyy')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
                  <Typography variant="body1">{selectedReturn.supplier?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                  <Typography variant="body1">{selectedReturn.product?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1">{selectedReturn.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="body1">₹{selectedReturn.total.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Payment Amount</Typography>
                  <Typography variant="body1">₹{selectedReturn.paymentAmount.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Payment Type</Typography>
                  <Typography variant="body1">{selectedReturn.paymentType}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Reason for Return</Typography>
                  <Typography variant="body1">{selectedReturn.reason || 'No reason provided'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{selectedReturn.status}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseReturn; 