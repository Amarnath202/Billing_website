import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { reportsAPI, warehouseAPI } from '../../services/api';

const ProfitLoss = () => {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // Start of year
    toDate: format(new Date(), 'yyyy-MM-dd'), // Today
    warehouse: ''
  });
  const [warehouses, setWarehouses] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      showSnackbar('Failed to fetch warehouses', 'error');
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        fromDate: filters.fromDate,
        toDate: filters.toDate
      };

      if (filters.warehouse) {
        params.warehouse = filters.warehouse;
      }

      const response = await reportsAPI.getProfitLoss(params);
      setReportData(response.data.data);
      setSummary(response.data.summary);

      showSnackbar('Report generated successfully', 'success');
    } catch (error) {
      console.error('Error fetching report:', error);
      showSnackbar('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchReport();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    fetchReport();
  };

  const handleClose = () => {
    setFilters({
      fromDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd'),
      warehouse: ''
    });
  };

  const handleReset = () => {
    // Reset filters
    setFilters({
      fromDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd'),
      warehouse: ''
    });

    // Reset report data to empty/zero values
    setReportData([
      {
        transactionType: 'Sale Without Tax (+)',
        totalAmount: 0
      },
      {
        transactionType: 'Sale Return Without Tax (-)',
        totalAmount: 0
      },
      {
        transactionType: 'Purchase Without Tax (-)',
        totalAmount: 0
      },
      {
        transactionType: 'Purchase Return Without Tax (+)',
        totalAmount: 0
      },
      {
        transactionType: 'Expense without Tax (-)',
        totalAmount: 0
      }
    ]);

    // Reset summary to zero values
    setSummary({
      grossSales: 0,
      salesReturns: 0,
      netSales: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      operatingExpenses: 0,
      netProfit: 0
    });

    showSnackbar('Report data reset successfully', 'info');
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
          Profit and Loss Report
        </Typography>

        {/* Filter Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#ff9f43', fontWeight: 600 }}>
              <FilterIcon sx={{ mr: 1 }} />
              Filter
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={filters.warehouse}
                    onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                    label="Warehouse"
                  >
                    <MenuItem value="">Select Warehouse</MenuItem>
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse._id} value={warehouse._id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                      backgroundColor: '#ff9f43',
                      '&:hover': { backgroundColor: '#f39c12' }
                    }}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClose}
                    disabled={loading}
                    sx={{
                      color: '#ff9f43',
                      borderColor: '#ff9f43',
                      '&:hover': {
                        backgroundColor: '#fff3e0',
                        borderColor: '#ff9f43'
                      }
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={loading}
                    sx={{
                      color: '#dc3545',
                      borderColor: '#dc3545',
                      '&:hover': {
                        backgroundColor: '#dc3545',
                        color: 'white',
                        borderColor: '#dc3545'
                      }
                    }}
                  >
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Balance Sheet Report */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ff9f43' }}>
              Balance Sheet Report
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                        Transaction Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                        Total Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                        Transaction Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Total Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                          {item.transactionType}
                        </TableCell>
                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                          {formatCurrency(item.totalAmount)}
                        </TableCell>
                        {index === 0 && (
                          <>
                            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                              Gross Profit
                            </TableCell>
                            <TableCell>
                              {summary ? formatCurrency(summary.grossProfit || 0) : '0.00'}
                            </TableCell>
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontStyle: 'italic', color: '#666' }}>
                              (Sale Price - Average Purchase Price)
                            </TableCell>
                            <TableCell sx={{ fontStyle: 'italic', color: '#666' }}>
                              Sale Price = Sale Total - Discount Amount - Tax Amount
                            </TableCell>
                          </>
                        )}
                        {index > 1 && (
                          <>
                            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}></TableCell>
                            <TableCell></TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    
                    {/* Net Summary Row */}
                    <TableRow sx={{ backgroundColor: '#f9f9f9', fontWeight: 600 }}>
                      <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                        Net Summary
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                        {summary ? formatCurrency(summary.netProfit || 0) : '0.00'}
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

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
};

export default ProfitLoss;
