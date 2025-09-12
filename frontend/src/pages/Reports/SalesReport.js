import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TablePagination
} from '@mui/material';
import {
  FilterAlt as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { format } from 'date-fns';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const SalesReport = () => {
  const [reportData, setReportData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customer: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`);
      // Backend returns customers directly as an array
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.customer) params.append('customer', filters.customer);

      const response = await axios.get(`${API_URL}/reports/sales-report?${params}`);

      if (response.data.success) {
        setReportData(response.data.data);
        setSummary(response.data.summary);
      } else {
        setError('Failed to fetch sales report data');
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
      setError('Error fetching sales report data');
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.customer]);

  useEffect(() => {
    fetchCustomers();
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    fetchReportData();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customer: ''
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Sales Report', 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, 14, 32);
    
    // Add customer filter if applied
    if (filters.customer) {
      const customerName = customers.find(c => c._id === filters.customer)?.name || 'Unknown';
      doc.text(`Customer: ${customerName}`, 14, 40);
    }

    // Prepare table data
    const tableColumn = ['Date', 'Order ID', 'Customer', 'Grand Total', 'Paid Amount', 'Balance'];
    const tableRows = reportData.map(item => [
      format(new Date(item.date), 'dd/MM/yyyy'),
      item.orderId,
      item.customer,
      `₹${item.grandTotal.toFixed(2)}`,
      `₹${item.paidAmount.toFixed(2)}`,
      `₹${item.balance.toFixed(2)}`
    ]);

    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: filters.customer ? 48 : 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [255, 159, 67],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      }
    });

    // Add summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Summary:', 14, finalY);
    doc.text(`Total Records: ${summary.totalRecords}`, 14, finalY + 8);
    doc.text(`Total Grand Total: ₹${summary.totalGrandTotal.toFixed(2)}`, 14, finalY + 16);
    doc.text(`Total Paid Amount: ₹${summary.totalPaidAmount.toFixed(2)}`, 14, finalY + 24);
    doc.text(`Total Balance: ₹${summary.totalBalance.toFixed(2)}`, 14, finalY + 32);

    doc.save('sales-report.pdf');
  };

  const exportToExcel = () => {
    const worksheetData = reportData.map(item => ({
      'Date': format(new Date(item.date), 'dd/MM/yyyy'),
      'Order ID': item.orderId,
      'Customer': item.customer,
      'Product': item.product,
      'Quantity': item.quantity,
      'Grand Total': item.grandTotal,
      'Paid Amount': item.paidAmount,
      'Balance': item.balance,
      'Status': item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
    
    XLSX.writeFile(workbook, 'sales-report.xlsx');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600 }}>
         Sales Report
      </Typography>



      {/* Export Buttons */}
      {reportData.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Records Table */}
      {!loading && reportData.length > 0 && (
        <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1, color: '#ff9f43' }} />
          <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>Filter</Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={filters.customer}
                onChange={(e) => handleFilterChange('customer', e.target.value)}
                label="Customer"
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{
                  backgroundColor: '#ff9f43',
                  '&:hover': { backgroundColor: '#f39c12' },
                  fontWeight: 600
                }}
              >
                SUBMIT
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                sx={{
                  color: '#ff9f43',
                  borderColor: '#ff9f43',
                  '&:hover': {
                    backgroundColor: '#fff3e0',
                    borderColor: '#ff9f43'
                  }
                }}
              >
                RESET
              </Button>
            </Box>
          </Grid>
        </Grid>
        </Paper>
          <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #e0e0e0', color: '#ff9f43', fontWeight: 600 }}>
            Records
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.NO</TableCell>
                  <TableCell>DATE</TableCell>
                  <TableCell>ORDER ID</TableCell>
                  <TableCell>CUSTOMER</TableCell>
                  <TableCell>GRAND TOTAL</TableCell>
                  <TableCell>PAID AMOUNT</TableCell>
                  <TableCell>BALANCE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item, index) => (
                    <TableRow
                      key={item._id}
                      sx={{
                        backgroundColor: '#ffffff',
                        '&:hover': { backgroundColor: '#f8f9fa' }
                      }}
                    >
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{item.orderId}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>₹{item.grandTotal.toFixed(2)}</TableCell>
                      <TableCell>₹{item.paidAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          ₹{item.balance.toFixed(2)}
                          <Chip
                            label={item.status}
                            color={item.status === 'Paid' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          {reportData.length > 0 && (
            <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={reportData.length}
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
          )}
          </Paper>
         
      )}

      {/* No Data */}
      {!loading && reportData.length === 0 && !error && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#666', fontWeight: 500 }}>
            No sales records found for the selected criteria
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default SalesReport;
