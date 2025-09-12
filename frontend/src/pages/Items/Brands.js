import React, { useState, useEffect } from 'react';
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
import { brandAPI } from '../../services/api';

function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [stockDialog, setStockDialog] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch all brands
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await brandAPI.getAll();
      setBrands(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle dialog open for create/edit
  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || ''
      });
      setSelectedBrand(brand);
    } else {
      setFormData({
        name: '',
        description: ''
      });
      setSelectedBrand(null);
    }
    setOpenDialog(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (selectedBrand) {
        await brandAPI.update(selectedBrand._id, formData);
      } else {
        await brandAPI.create(formData);
      }
      fetchBrands();
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving brand');
    }
  };

  // Handle brand deletion
  const handleDelete = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await brandAPI.delete(brandId);
        fetchBrands();
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting brand');
      }
    }
  };

  // Handle viewing stock information
  const handleViewStock = async (brandId) => {
    try {
      const response = await brandAPI.getStock(brandId);
      setStockInfo(response.data);
      setStockDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching stock information');
    }
  };

  // Filter brands based on search query
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
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
      doc.text('Brands Report', 14, 22);

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
        'Brand Name', 'Description', 'Total Products', 'Total Stock'
      ];

      const tableRows = [];
      filteredBrands.forEach(brand => {
        const brandData = [
          brand.name || '-',
          brand.description || '-',
          brand.totalProducts?.toString() || '0',
          brand.totalStock?.toString() || '0'
        ];
        tableRows.push(brandData);
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
      doc.save(`brands-report-${new Date().toISOString().split('T')[0]}.pdf`);
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
      const excelData = filteredBrands.map(brand => {
        return {
          'Brand Name': brand.name || '',
          'Description': brand.description || '',
          'Total Products': brand.totalProducts || 0,
          'Total Stock': brand.totalStock || 0
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Brands');

      // Save the Excel file
      XLSX.writeFile(wb, `brands-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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
            Brand Management
          </Typography>
        </Box>

        {/* Search Bar and Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search brands..."
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
                <TableCell sx={{ fontWeight: 600, color: '#ff9f43' }}>BRAND NAME</TableCell>
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
              ) : filteredBrands.length > 0 ? (
                filteredBrands
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((brand) => (
                    <TableRow
                      key={brand._id}
                      sx={{
                      
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <TableCell>{brand.name}</TableCell>
                      <TableCell>{brand.description || 'No description'}</TableCell>
                      <TableCell>{brand.totalProducts || 0}</TableCell>
                      <TableCell>{brand.totalStock || 0}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleOpenDialog(brand)}
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
                    No brands found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredBrands.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredBrands.length}
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
          {selectedBrand ? 'Edit Brand' : 'Add New Brand'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: '400px' }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Brand Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                error={!formData.name}
                helperText={!formData.name ? 'Brand name is required' : ''}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
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
            {selectedBrand ? 'Save Changes' : 'Create Brand'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Information Dialog */}
      <Dialog open={stockDialog} onClose={() => setStockDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          Brand Stock Information
        </DialogTitle>
        <DialogContent>
          {stockInfo && (
            <Box sx={{ pt: 2, width: '400px' }}>
              <Typography variant="subtitle1" gutterBottom>
                Total Products: {stockInfo.totalProducts}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Total Stock: {stockInfo.totalStock}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Products
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockInfo.products.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>{product.productId}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Brands; 