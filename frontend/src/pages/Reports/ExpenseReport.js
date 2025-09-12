import React, { useState, useEffect, useCallback } from 'react';
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

const ExpenseReport = () => {
  const [reportData, setReportData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: ''
  });
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalAmount: 0,
    statusBreakdown: {},
    paymentTypeBreakdown: {}
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);



  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/expenses/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category) params.append('category', filters.category);

      const response = await axios.get(`${API_URL}/reports/expense-report?${params}`);

      if (response.data.success) {
        setReportData(response.data.data);
        setSummary(response.data.summary);
      } else {
        setError('Failed to fetch expense report data');
      }
    } catch (error) {
      console.error('Error fetching expense report:', error);
      setError('Error fetching expense report data');
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.category]);

  useEffect(() => {
    fetchCategories();
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
      category: ''
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
    doc.text('Expense Report', 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, 14, 32);
    
    // Add filters if applied
    let yPosition = 40;
    if (filters.category) {
      doc.text(`Category: ${filters.category}`, 14, yPosition);
      yPosition += 8;
    }

    // Prepare table data
    const tableColumn = ['Date', 'Expense #', 'Category', 'Amount', 'Payment Type', 'Status'];
    const tableRows = reportData.map(item => [
      format(new Date(item.date), 'dd/MM/yyyy'),
      item.expenseNumber,
      item.category,
      `₹${item.amount.toFixed(2)}`,
      item.paymentType,
      item.status
    ]);

    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPosition,
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
    doc.text(`Total Amount: ₹${summary.totalAmount.toFixed(2)}`, 14, finalY + 16);

    doc.save('expense-report.pdf');
  };

  const exportToExcel = () => {
    const worksheetData = reportData.map(item => ({
      'Date': format(new Date(item.date), 'dd/MM/yyyy'),
      'Expense Number': item.expenseNumber,
      'Category': item.category,
      'Amount': item.amount,
      'Payment Type': item.paymentType,
      'Description': item.description,
      'Vendor': item.vendor,
      'Reference': item.reference,
      'Status': item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expense Report');
    
    XLSX.writeFile(workbook, 'expense-report.xlsx');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600 }}>
        Expense Report
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
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
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
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>EXPENSE #</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>PAYMENT TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>VENDOR</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>STATUS</TableCell>
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
                      <TableCell>{item.expenseNumber}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                      <TableCell>{item.paymentType}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={
                            item.status === 'Paid' ? 'success' :
                            item.status === 'Approved' ? 'info' :
                            item.status === 'Pending' ? 'warning' : 'error'
                          }
                          size="small"
                        />
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
            No expense records found for the selected criteria
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ExpenseReport;
