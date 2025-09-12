import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  CircularProgress,
  Tabs,
  Tab,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { warehouseAPI } from '../../services/api';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`warehouse-tabpanel-${index}`}
      aria-labelledby={`warehouse-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseProducts, setWarehouseProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProductsForWarehouses = useCallback(async () => {
    try {
      const productsData = {};
      for (const warehouse of warehouses) {
        const response = await axios.get(`${API_URL}/products/warehouse/${warehouse._id}`);
        productsData[warehouse._id] = response.data;
      }
      setWarehouseProducts(productsData);
    } catch (error) {
      console.error('Error fetching warehouse products:', error);
      toast.error('Failed to load warehouse products');
    }
  }, [warehouses]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      fetchProductsForWarehouses();
    }
  }, [warehouses, fetchProductsForWarehouses]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
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
      if (selectedWarehouse) {
        await warehouseAPI.update(selectedWarehouse._id, formData);
        toast.success('Warehouse updated successfully');
      } else {
        await warehouseAPI.create(formData);
        toast.success('Warehouse created successfully');
      }
      setOpenDialog(false);
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      toast.error(error.response?.data?.message || 'Failed to save warehouse');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await warehouseAPI.delete(id);
        toast.success('Warehouse deleted successfully');
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        toast.error('Failed to delete warehouse');
      }
    }
  };

  const handleOpenDialog = (warehouse = null) => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        description: warehouse.description || ''
      });
      setSelectedWarehouse(warehouse);
    } else {
      setFormData({
        name: '',
        description: ''
      });
      setSelectedWarehouse(null);
    }
    setOpenDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600   }}>
          Warehouse Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: '#ff9f43',
            '&:hover': { backgroundColor: '#f39c12' }
          }}
        >
          Add New Warehouse
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3   }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider',   }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="warehouse tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'text.primary',
                  '&.Mui-selected': {
                    color: '#ff9f43',
                    fontWeight: 'bold'
                  }
                }
              }}
            >
              {warehouses.map((warehouse) => (
                <Tab 
                  key={warehouse._id} 
                  label={warehouse.name}
                />
              ))}
            </Tabs>
          </Box>

          {warehouses.map((warehouse, index) => (
            <TabPanel key={warehouse._id} value={currentTab} index={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>
                  Products in {warehouse.name}
                </Typography>
                <Box>
                  <IconButton onClick={() => handleOpenDialog(warehouse)} size="small" sx={{ color: '#ff9f43' }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(warehouse._id)} size="small" sx={{ color: '#f44336' }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warehouseProducts[warehouse._id]?.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>{product.productId}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                      </TableRow>
                    ))}
                    {(!warehouseProducts[warehouse._id] || warehouseProducts[warehouse._id].length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No products in this warehouse
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={warehouses.length}
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
              </TableContainer>
            </TabPanel>
          ))}
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#ff9f43', fontWeight: 600,borderBottom: '1px solid #e0e0e0',}} >
          {selectedWarehouse ? 'Edit Warehouse' : 'Create New Warehouse'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Warehouse Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                error={!formData.name}
                helperText={!formData.name ? 'Warehouse name is required' : ''}
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
            {selectedWarehouse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Warehouses; 