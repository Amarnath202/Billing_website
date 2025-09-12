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
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
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

const PurchaseReport = () => {
  const [reportData, setReportData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supplier: ''
  });
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalGrandTotal: 0,
    totalPaidAmount: 0,
    totalBalance: 0
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchSuppliers();
    fetchReportData();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers`);
      // Backend returns suppliers directly as an array
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.supplier) params.append('supplier', filters.supplier);

      const response = await axios.get(`${API_URL}/reports/purchase-report?${params}`);
      
      if (response.data.success) {
        setReportData(response.data.data);
        setSummary(response.data.summary);
      } else {
        setError('Failed to fetch purchase report data');
      }
    } catch (error) {
      console.error('Error fetching purchase report:', error);
      setError('Error fetching purchase report data');
    } finally {
      setLoading(false);
    }
  };

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
      supplier: ''
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
    doc.text('Purchase Report', 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, 14, 32);
    
    // Add supplier filter if applied
    if (filters.supplier) {
      const supplierName = suppliers.find(s => s._id === filters.supplier)?.name || 'Unknown';
      doc.text(`Supplier: ${supplierName}`, 14, 40);
    }

    // Prepare table data
    const tableColumn = ['Date', 'Order ID', 'Supplier', 'Grand Total', 'Paid Amount', 'Balance'];
    const tableRows = reportData.map(item => [
      format(new Date(item.date), 'dd/MM/yyyy'),
      item.orderId,
      item.supplier,
      `₹${item.grandTotal.toFixed(2)}`,
      `₹${item.paidAmount.toFixed(2)}`,
      `₹${item.balance.toFixed(2)}`
    ]);

    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: filters.supplier ? 48 : 40,
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

    doc.save('purchase-report.pdf');
  };

  const exportToExcel = () => {
    const worksheetData = reportData.map(item => ({
      'Date': format(new Date(item.date), 'dd/MM/yyyy'),
      'Order ID': item.orderId,
      'Supplier': item.supplier,
      'Product': item.product,
      'Quantity': item.quantity,
      'Grand Total': item.grandTotal,
      'Paid Amount': item.paidAmount,
      'Balance': item.balance,
      'Status': item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Report');
    
    XLSX.writeFile(workbook, 'purchase-report.xlsx');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600 }}>
         Purchase Report
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
              <InputLabel>Supplier</InputLabel>
              <Select
                value={filters.supplier}
                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                label="Supplier"
              >
                <MenuItem value="">All Suppliers</MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
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
                <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>S.NO</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>ORDER ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>SUPPLIER</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>GRAND TOTAL</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>PAID AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>BALANCE</TableCell>
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
                      <TableCell>{item.supplier}</TableCell>
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
            No purchase records found for the selected criteria
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default PurchaseReport;
