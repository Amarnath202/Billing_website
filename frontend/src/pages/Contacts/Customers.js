import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
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
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { customerAPI } from '../../services/api';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerAPI.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCustomerDialogOpen = () => {
    setIsEditMode(false);
    setEditingCustomerId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCustomerDialogClose = () => {
    setOpenDialog(false);
    setIsEditMode(false);
    setEditingCustomerId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.phone) errors.phone = 'Phone is required';
    if (!formData.address) errors.address = 'Address is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerSubmit = async () => {
    console.log('Form data before validation:', formData);
    console.log('Is edit mode:', isEditMode);
    console.log('Editing customer ID:', editingCustomerId);

    if (!validateForm()) {
      console.log('Form validation failed:', formErrors);
      return;
    }

    try {
      const submitData = { ...formData };
      delete submitData.customerId; // Remove customerId from the request payload

      console.log('Submitting customer data:', submitData);

      if (isEditMode && editingCustomerId) {
        // Update existing customer
        await customerAPI.update(editingCustomerId, submitData);
        showSnackbar('Customer updated successfully');
      } else {
        // Create new customer
        await customerAPI.create(submitData);
        showSnackbar('Customer added successfully');
      }

      fetchCustomers();
      handleCustomerDialogClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      console.error('Error response:', error.response?.data);
      const action = isEditMode ? 'update' : 'save';
      showSnackbar(error.response?.data?.message || `Failed to ${action} customer`, 'error');
    }
  };

  const handleEditCustomer = (customer) => {
    console.log('Editing customer:', customer);
    setIsEditMode(true);
    setEditingCustomerId(customer._id); // Use MongoDB _id for API calls
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      customerId: customer.customerId
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id);
        showSnackbar('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        showSnackbar('Failed to delete customer', 'error');
      }
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Customers Management Report', 14, 22);
      
      // Add filters info
      doc.setFontSize(11);
      doc.setTextColor(100);
      let filterText = 'Filters: ';
      if (searchTerm) {
        filterText += `Search: ${searchTerm}`;
      } else {
        filterText += 'None';
      }
      doc.text(filterText, 14, 30);

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

      // Prepare table data
      const tableColumn = ['Name', 'Email', 'Phone', 'Address'];
      const tableRows = customers.map(customer => [
        customer.name,
        customer.email,
        customer.phone,
        customer.address
      ]);

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

      // Add total count at the bottom
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 40;
      doc.setFontSize(10);
      doc.setTextColor(255, 159, 67);
      doc.text(`Total Customers: ${customers.length}`, 14, finalY + 10);

      // Save the PDF
      doc.save('customers-report.pdf');
      showSnackbar('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF', 'error');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/customers/download/excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      showSnackbar('Error downloading Excel file', 'error');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#ff9f43', fontWeight: 600, fontSize: '2rem' }}>
            Customers Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                width: '200px',
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
            <Button
              variant="contained"
              color="success"
              onClick={handleDownloadPDF}
              startIcon={<FaFilePdf />}
              sx={{ mr: 1 }}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadExcel}
              startIcon={<FaFileExcel />}
              sx={{ mr: 1 }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCustomerDialogOpen}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#f39c12',
                },
              }}
            >
              Add Customer
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditCustomer(customer)}
                        sx={{ color: '#ff9f43' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteCustomer(customer._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCustomers.length}
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

      <Dialog open={openDialog} onClose={handleCustomerDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#ff9f43', fontWeight: 600,borderBottom: '1px solid #e0e0e0',}} >{isEditMode ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              error={!!formErrors.address}
              helperText={formErrors.address}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCustomerDialogClose} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Cancel</Button>
          <Button
            onClick={handleCustomerSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#ff9f43',
              '&:hover': {
                backgroundColor: '#f39c12',
              },
            }}
          >
            {isEditMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Customers; 