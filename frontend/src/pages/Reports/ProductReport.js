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
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const ProductReport = () => {
  const [reportData, setReportData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    warehouse: ''
  });
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockProducts: 0
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchWarehouses();
    fetchReportData();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_URL}/brands`);
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${API_URL}/warehouses`);
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.warehouse) params.append('warehouse', filters.warehouse);

      const response = await axios.get(`${API_URL}/reports/product-report?${params}`);
      
      if (response.data.success) {
        setReportData(response.data.data);
        setSummary(response.data.summary);
      } else {
        setError('Failed to fetch product report data');
      }
    } catch (error) {
      console.error('Error fetching product report:', error);
      setError('Error fetching product report data');
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
      category: '',
      brand: '',
      warehouse: ''
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
    doc.text('Product Report', 14, 22);
    
    // Add filters
    doc.setFontSize(12);
    let yPosition = 32;
    if (filters.category) {
      const categoryName = categories.find(c => c.name === filters.category)?.name || 'Unknown';
      doc.text(`Category: ${categoryName}`, 14, yPosition);
      yPosition += 8;
    }
    if (filters.brand) {
      doc.text(`Brand: ${filters.brand}`, 14, yPosition);
      yPosition += 8;
    }
    if (filters.warehouse) {
      const warehouseName = warehouses.find(w => w._id === filters.warehouse)?.name || 'Unknown';
      doc.text(`Warehouse: ${warehouseName}`, 14, yPosition);
      yPosition += 8;
    }

    // Prepare table data
    const tableColumn = ['Product ID', 'Name', 'Brand', 'Category', 'Price', 'Stock', 'Warehouse'];
    const tableRows = reportData.map(item => [
      item.productId,
      item.name,
      item.brand,
      item.category,
      `₹${item.productPrice.toFixed(2)}`,
      item.stock.toString(),
      item.warehouse
    ]);

    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPosition + 8,
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
    doc.text(`Total Products: ${summary.totalProducts}`, 14, finalY + 8);
    doc.text(`Total Stock: ${summary.totalStock}`, 14, finalY + 16);
    doc.text(`Total Value: ₹${summary.totalValue.toFixed(2)}`, 14, finalY + 24);
    doc.text(`Low Stock Products: ${summary.lowStockProducts}`, 14, finalY + 32);

    doc.save('product-report.pdf');
  };

  const exportToExcel = () => {
    const worksheetData = reportData.map(item => ({
      'Product ID': item.productId,
      'Name': item.name,
      'Brand': item.brand,
      'Category': item.category,
      'Description': item.description,
      'Price': item.productPrice,
      'Stock': item.stock,
      'Warehouse': item.warehouse,
      'Stock Value': item.stockValue,
      'Stock Status': item.stockStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Report');
    
    XLSX.writeFile(workbook, 'product-report.xlsx');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600 }}>
        Product Report
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
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Brand</InputLabel>
              <Select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                label="Brand"
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand._id} value={brand.name}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Warehouse</InputLabel>
              <Select
                value={filters.warehouse}
                onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                label="Warehouse"
              >
                <MenuItem value="">All Warehouses</MenuItem>
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
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
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>PRODUCT ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>NAME</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>BRAND</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>PRICE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>STOCK</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>WAREHOUSE</TableCell>
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
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>₹{item.productPrice.toFixed(2)}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.stockStatus}
                          color={
                            item.stockStatus === 'In Stock' ? 'success' :
                            item.stockStatus === 'Low Stock' ? 'warning' : 'error'
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
            No products found for the selected criteria
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ProductReport;
