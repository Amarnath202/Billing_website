import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TablePagination
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5001/api';

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [uniqueProducts, setUniqueProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/sales`);
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    // Filter sales whenever filter criteria change
    let filtered = [...sales];

    if (fromDate && toDate) {
      const fromDateTime = new Date(fromDate).setHours(0, 0, 0, 0);
      const toDateTime = new Date(toDate).setHours(23, 59, 59, 999);

      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date).getTime();
        return saleDate >= fromDateTime && saleDate <= toDateTime;
      });
    }

    if (productFilter) {
      filtered = filtered.filter(sale =>
        sale.items.some(item => item.product === productFilter)
      );
    }

    setFilteredSales(filtered);
  }, [sales, fromDate, toDate, productFilter]);

  useEffect(() => {
    // Extract unique product names from sales
    if (sales.length > 0) {
      const products = new Set();
      sales.forEach(sale => {
        sale.items.forEach(item => {
          if (item.product) {
            products.add(item.product);
          }
        });
      });
      setUniqueProducts(Array.from(products).sort());
    }
  }, [sales]);

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setProductFilter('');
    setFilteredSales(sales);
  };

  const handleOpenViewModal = (sale) => {
    setSelectedSale(sale);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedSale(null);
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/sales/${saleToDelete._id}`);

      // Refresh the sales list
      await fetchSales();

      setSnackbar({
        open: true,
        message: 'Sale deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete sale',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setSaleToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSaleToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getFirstItem = (sale) => {
    return sale.items && sale.items.length > 0 ? sale.items[0] : {};
  };

  const generatePDF = () => {
    // Create new jsPDF instance
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(255, 159, 67);
    doc.text('Sales History Report', 14, 22);
    
    // Add filters info
    doc.setFontSize(11);
    doc.setTextColor(100);
    let filterText = 'Filters: ';
    if (fromDate && toDate) {
      filterText += `Date Range: ${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`;
    }
    if (productFilter) {
      filterText += ` | Product: ${productFilter}`;
    }
    doc.text(filterText, 14, 30);

    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

    // Prepare table data
    const tableColumn = ['Date', 'Bill Number', 'Product', 'Brand', 'Quantity', 'Price', 'Total'];
    const tableRows = filteredSales.map(sale => {
      const firstItem = getFirstItem(sale);
      return [
        format(new Date(sale.date), 'dd/MM/yyyy HH:mm'),
        sale.billNumber,
        firstItem.product || '-',
        firstItem.brand || '-',
        firstItem.quantity || '0',
        `₹${(firstItem.price || 0).toFixed(2)}`,
        `₹${(sale.totalAmount || 0).toFixed(2)}`
      ];
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
    const totalAmount = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 40;
    doc.setFontSize(10);
    doc.setTextColor(255, 159, 67);
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, finalY + 10);

    // Save the PDF
    doc.save('sales-history.pdf');
  };

  const generateExcel = () => {
    // Prepare data
    const excelData = filteredSales.map(sale => {
      const firstItem = getFirstItem(sale);
      return {
        'Date': format(new Date(sale.date), 'dd/MM/yyyy HH:mm'),
        'Bill Number': sale.billNumber,
        'Product': firstItem.product || '-',
        'Brand': firstItem.brand || '-',
        'Quantity': firstItem.quantity || '0',
        'Price': firstItem.price || '0',
        'Total': sale.totalAmount || '0'
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add header row styling
    ws['!cols'] = [
      { wch: 20 }, // Date
      { wch: 15 }, // Bill Number
      { wch: 20 }, // Product
      { wch: 15 }, // Brand
      { wch: 10 }, // Quantity
      { wch: 12 }, // Price
      { wch: 12 }  // Total
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales History');

    // Save the file
    XLSX.writeFile(wb, 'sales-history.xlsx');
  };

  // Add pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600 }}>
          Retailer Sales History
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                label="Product"
              >
                <MenuItem value="">All Products</MenuItem>
                {uniqueProducts.map((product) => (
                  <MenuItem key={product} value={product}>
                    {product}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{
                  borderColor: '#ff9f43',
                  color: '#ff9f43',
                  '&:hover': {
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(255, 159, 67, 0.04)'
                  }
                }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Export Buttons */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={generatePDF}
            sx={{
              backgroundColor: '#2E7D32', // Green color for PDF
              '&:hover': {
                backgroundColor: '#1B5E20',
              },
              textTransform: 'none',
              minWidth: '120px'
            }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<ExcelIcon />}
            onClick={generateExcel}
            sx={{
              backgroundColor: '#1976D2', // Blue color for Excel
              '&:hover': {
                backgroundColor: '#1565C0',
              },
              textTransform: 'none',
              minWidth: '120px'
            }}
          >
            EXCEL
          </Button>
        </Stack>
      </Box>

      {/* Sales Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>DATE</TableCell>
                <TableCell>BILL NUMBER</TableCell>
                <TableCell>PRODUCT</TableCell>
                <TableCell>BRAND</TableCell>
                <TableCell>QUANTITY</TableCell>
                <TableCell>PRICE</TableCell>
                <TableCell>TOTAL</TableCell>
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
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No sales records found for the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                // Apply pagination to the filtered sales
                filteredSales
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((sale) => {
                    const firstItem = getFirstItem(sale);
                    return (
                      <TableRow
                        key={sale._id}
                      >
                        <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{sale.billNumber}</TableCell>
                        <TableCell>{firstItem.product || '-'}</TableCell>
                        <TableCell>{firstItem.brand || '-'}</TableCell>
                        <TableCell>{firstItem.quantity || 0}</TableCell>
                        <TableCell>₹{(firstItem.price || 0).toFixed(2)}</TableCell>
                        <TableCell>₹{(sale.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleOpenViewModal(sale)}
                            size="small"
                            sx={{ color: '#ff9f43', mr: 1 }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteClick(sale)}
                            size="small"
                            sx={{
                              color: '#dc3545',
                              '&:hover': { backgroundColor: 'rgba(220, 53, 69, 0.1)' }
                            }}
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
        </TableContainer>
        {/* Add TablePagination component */}
        {!loading && filteredSales.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSales.length}
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

      {/* View Sale Details Modal */}
      <Dialog 
        open={viewModalOpen} 
        onClose={handleCloseViewModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: '#ff9f43', 
          color: 'white',
          fontWeight: 600 
        }}>
          Sale Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedSale && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Bill Number: {selectedSale.billNumber}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Date: {format(new Date(selectedSale.date), 'dd/MM/yyyy HH:mm')}
                </Typography>
              </Box>
              
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSale.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.price.toFixed(2)}</TableCell>
                        <TableCell>₹{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>
                  Total Amount: ₹{selectedSale.totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          backgroundColor: '#dc3545',
          color: 'white',
          fontWeight: 600
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Are you sure you want to delete this sale record?
          </Typography>
          {saleToDelete && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Bill Number:</strong> {saleToDelete.billNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {format(new Date(saleToDelete.date), 'dd/MM/yyyy HH:mm')}
              </Typography>
              <Typography variant="body2">
                <strong>Total Amount:</strong> ₹{(saleToDelete.totalAmount || 0).toFixed(2)}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ mt: 2, color: '#dc3545' }}>
            <strong>Warning:</strong> This action cannot be undone. The product quantities will be restored to inventory.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{ ml: 1 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SalesHistory; 