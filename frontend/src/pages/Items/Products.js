import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Snackbar,
  Alert,
  Container,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5001/api';

function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [newProduct, setNewProduct] = useState({
    productId: '',
    name: '',
    brand: '',
    category: '',
    description: '',
    productPrice: '',
    stock: '',
    warehouse: '',
    barcode: '', // Add barcode field
  });

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/warehouses`);
      console.log('Fetched warehouses:', response.data);
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      showAlert('Error fetching warehouses', 'error');
    }
  }, []);

  // Move fetchProducts into useCallback
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      console.log('Fetched products:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showAlert('Error fetching products', 'error');
    }
  }, []); // Empty dependency array since it only depends on constants

  // Update useEffect to include fetchProducts and fetchWarehouses
  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, [fetchProducts, fetchWarehouses]);

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct({
        ...product,
        warehouse: product.warehouse?._id || product.warehouse || ''
      });
    } else {
      setEditingProduct(null);
      setNewProduct({
        productId: '',
        name: '',
        brand: '',
        category: '',
        description: '',
        productPrice: '',
        stock: '',
        warehouse: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    try {
      // Log the raw form data
      console.log('Raw form data:', newProduct);

      // Validate required fields
      const requiredFields = ['productId', 'name', 'brand', 'category', 'description', 'productPrice', 'stock', 'warehouse'];
      const missingFields = requiredFields.filter(field => {
        const value = newProduct[field];
        return value === undefined || value === null || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        showAlert(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
        return;
      }

      // Validate numeric fields
      const numericFields = {
        productPrice: Number(newProduct.productPrice),
        stock: Number(newProduct.stock)
      };

      console.log('Numeric field values:', numericFields);

      // Check for NaN values
      const nanFields = Object.entries(numericFields)
        .filter(([_, value]) => isNaN(value))
        .map(([field]) => field);

      if (nanFields.length > 0) {
        console.log('Invalid numeric values:', nanFields);
        showAlert(`Please enter valid numbers for: ${nanFields.join(', ')}`, 'error');
        return;
      }

      // Check for valid ranges
      if (numericFields.productPrice <= 0) {
        showAlert('Product price must be greater than 0', 'error');
        return;
      }
      if (numericFields.stock < 0) {
        showAlert('Stock cannot be negative', 'error');
        return;
      }

      // Validate product ID format (alphanumeric only)
      if (!/^[a-zA-Z0-9]+$/.test(newProduct.productId.trim())) {
        showAlert('Product ID must contain only letters and numbers', 'error');
        return;
      }

      const productData = {
        ...newProduct,
        productId: newProduct.productId.trim(),
        name: newProduct.name.trim(),
        brand: newProduct.brand.trim(),
        category: newProduct.category.trim(),
        description: newProduct.description.trim(),
        productPrice: numericFields.productPrice,
        stock: numericFields.stock
      };

      console.log('Final product data being sent:', productData);

      if (editingProduct) {
        console.log('Updating product with ID:', editingProduct._id);
        const response = await axios.put(`${API_URL}/products/${editingProduct._id}`, productData);
        console.log('Update response:', response.data);
        showAlert('Product updated successfully');
      } else {
        console.log('Creating new product');
        const response = await axios.post(`${API_URL}/products`, productData);
        console.log('Create response:', response.data);
        showAlert('Product added successfully');
      }
      await fetchProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting product:', error);
      showAlert(error.response?.data?.message || 'Error submitting product', 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/products/${productId}`);
        showAlert('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        showAlert('Error deleting product', 'error');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    Object.values(product).some(value =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Add these handlers for pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Products Report', 14, 22);

      // Add search info
      doc.setFontSize(11);
      doc.setTextColor(100);
      let filterText = 'Filters: ';
      if (searchQuery) {
        filterText += `Search: ${searchQuery}`;
      } else {
        filterText += 'None';
      }
      doc.text(filterText, 14, 32);

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 37);

      // Prepare table data
      const tableColumn = [
        'Product ID', 'Name', 'Brand', 'Category', 'Description', 'Price', 'Stock', 'Warehouse'
      ];

      const tableRows = [];
      filteredProducts.forEach(product => {
        const productData = [
          product.productId || '-',
          product.name || '-',
          product.brand || '-',
          product.category || '-',
          product.description || '-',
          `₹${product.productPrice || '0.00'}`,
          product.stock?.toString() || '0',
          product.warehouse?.name || 'N/A'
        ];
        tableRows.push(productData);
      });

      // Generate the table using the autoTable plugin
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
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

      // Save the PDF
      doc.save(`products-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredProducts.map(product => {
        return {
          'Product ID': product.productId || '',
          'Name': product.name || '',
          'Brand': product.brand || '',
          'Category': product.category || '',
          'Description': product.description || '',
          'Price': product.productPrice || 0,
          'Stock': product.stock || 0,
          'Warehouse': product.warehouse?.name || 'N/A'
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      // Save the Excel file
      XLSX.writeFile(wb, `products-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      toast.error('Error generating Excel file');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, fontSize: '2rem' }}>
            Product Management
          </Typography>
        </Box>

        {/* Search Bar and Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search products..."
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
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#f39c12',
                },
              }}
            >
              ADD PRODUCT
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PRODUCT ID</TableCell>
                <TableCell>BARCODE</TableCell>
                <TableCell>NAME</TableCell>
                <TableCell>BRAND</TableCell>
                <TableCell>CATEGORY</TableCell>
                <TableCell>DESCRIPTION</TableCell>
                <TableCell>PRICE</TableCell>
                <TableCell>STOCK</TableCell>
                <TableCell>WAREHOUSE</TableCell>
                <TableCell>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow
                      key={product._id}
                      sx={{
                        
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <TableCell>{product.productId}</TableCell>
                      <TableCell>{product.barcode || product.productId}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>{product.category || 'N/A'}</TableCell>
                      <TableCell>{product.description}</TableCell>
                      <TableCell>₹{product.productPrice}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.warehouse?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleOpenDialog(product)}
                          size="small"
                          sx={{ color: '#ff9f43', mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(product._id)}
                          size="small"
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredProducts.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProducts.length}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField
              name="productId"
              label="Product ID"
              value={newProduct.productId}
              onChange={handleInputChange}
              fullWidth
              required
              error={!newProduct.productId}
              helperText={!newProduct.productId ? "Product ID is required" : ""}
            />
            <TextField
              name="barcode"
              label="Barcode"
              value={newProduct.barcode}
              onChange={handleInputChange}
              fullWidth
              helperText="Leave empty to use Product ID as barcode"
            />
            <TextField
              name="name"
              label="Name"
              value={newProduct.name}
              onChange={handleInputChange}
              fullWidth
              required
              error={!newProduct.name}
              helperText={!newProduct.name ? "Name is required" : ""}
            />
            <TextField
              name="brand"
              label="Brand"
              value={newProduct.brand}
              onChange={handleInputChange}
              fullWidth
              required
              error={!newProduct.brand}
              helperText={!newProduct.brand ? "Brand is required" : ""}
            />
            <TextField
              name="category"
              label="Category"
              value={newProduct.category}
              onChange={handleInputChange}
              fullWidth
              required
              error={!newProduct.category}
              helperText={!newProduct.category ? "Category is required" : ""}
            />
            <TextField
              name="description"
              label="Description"
              value={newProduct.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              required
              error={!newProduct.description}
              helperText={!newProduct.description ? "Description is required" : ""}
            />
            <TextField
              name="productPrice"
              label="Product Price"
              type="number"
              value={newProduct.productPrice}
              onChange={handleInputChange}
              fullWidth
              required
              error={!newProduct.productPrice || Number(newProduct.productPrice) <= 0}
              helperText={!newProduct.productPrice ? "Product price is required" : Number(newProduct.productPrice) <= 0 ? "Product price must be greater than 0" : ""}
              inputProps={{ min: "0", step: "0.01" }}
            />
            <TextField
              name="stock"
              label="Stock"
              type="number"
              value={newProduct.stock}
              onChange={handleInputChange}
              fullWidth
              required
              error={!newProduct.stock || Number(newProduct.stock) < 0}
              helperText={!newProduct.stock ? "Stock is required" : Number(newProduct.stock) < 0 ? "Stock cannot be negative" : ""}
              inputProps={{ min: "0", step: "1" }}
            />
            <FormControl fullWidth required error={!newProduct.warehouse}>
              <InputLabel>Warehouse</InputLabel>
              <Select
                name="warehouse"
                value={newProduct.warehouse}
                onChange={handleInputChange}
                label="Warehouse"
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#ff9f43',
              '&:hover': {
                backgroundColor: '#ff9f43dd'
              }
            }}
          >
            {editingProduct ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Products; 