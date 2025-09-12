import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
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
  FormControl,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
 
} from '@mui/icons-material';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { categoryAPI } from '../../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stockDialog, setStockDialog] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const handleOpenDialog = (category = null) => {
    setSelectedCategory(category);
    setFormData({
      name: category ? category.name : '',
      description: category ? category.description : ''
    });
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedCategory) {
        await categoryAPI.update(selectedCategory._id, formData);
        showSnackbar('Category updated successfully');
      } else {
        await categoryAPI.create(formData);
        showSnackbar('Category created successfully');
      }
      setOpenDialog(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showSnackbar('Error saving category', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryAPI.delete(id);
        showSnackbar('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        showSnackbar('Error deleting category', 'error');
      }
    }
  };

  const handleViewStock = async (category) => {
    try {
      const response = await categoryAPI.getStock(category._id);
      setStockInfo(response.data);
      setStockDialog(true);
    } catch (error) {
      console.error('Error fetching stock info:', error);
      showSnackbar('Error fetching stock information', 'error');
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination handlers
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // PDF Download function
  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Categories Report', 14, 22);

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
        'Category Name', 'Description', 'Total Products', 'Total Stock'
      ];

      const tableRows = [];
      filteredCategories.forEach(category => {
        const categoryData = [
          category.name || '-',
          category.description || '-',
          category.totalProducts?.toString() || '0',
          category.totalStock?.toString() || '0'
        ];
        tableRows.push(categoryData);
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
      doc.save(`categories-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  // Excel Download function
  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredCategories.map(category => {
        return {
          'Category Name': category.name || '',
          'Description': category.description || '',
          'Total Products': category.totalProducts || 0,
          'Total Stock': category.totalStock || 0
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Categories');

      // Save the Excel file
      XLSX.writeFile(wb, `categories-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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
            Category Management
          </Typography>
        </Box>

        {/* Search Bar and Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search categories..."
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

      {/* Table */}
      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>CATEGORY NAME</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>TOTAL PRODUCTS</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>TOTAL STOCK</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress sx={{ color: '#ff9f43' }} />
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length > 0 ? (
                filteredCategories
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((category) => (
                    <TableRow
                      key={category._id}
                      sx={{
                       
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description || 'No description'}</TableCell>
                      <TableCell>{category.totalProducts || 0}</TableCell>
                      <TableCell>{category.totalStock || 0}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleOpenDialog(category)}
                          size="small"
                          sx={{ color: '#ff9f43', mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredCategories.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCategories.length}
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          {selectedCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: '100%' }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                error={!formData.name}
                helperText={!formData.name ? 'Category name is required' : ''}
                fullWidth
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#ff9f43',
              '&:hover': { backgroundColor: '#f39c12' }
            }}
          >
            {selectedCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Information Dialog */}
      <Dialog open={stockDialog} onClose={() => setStockDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          Category Stock Information
        </DialogTitle>
        <DialogContent>
          {stockInfo && (
            <Box sx={{ pt: 2, width: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Category:</strong> {stockInfo.categoryName}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Total Products:</strong> {stockInfo.totalProducts}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Total Stock:</strong> {stockInfo.totalStock}
              </Typography>
              {stockInfo.products && stockInfo.products.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Products in this Category:</Typography>
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product Name</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stockInfo.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>₹{product.price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Categories;
