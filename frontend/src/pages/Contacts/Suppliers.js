import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import axios from 'axios';
import { supplierAPI } from '../../services/api';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      showSnackbar('Error fetching suppliers', 'error');
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Suppliers Management Report', 14, 22);
      
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
      const tableRows = filteredSuppliers.map(supplier => [
        supplier.name,
        supplier.email,
        supplier.phone,
        supplier.address
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
      doc.text(`Total Suppliers: ${filteredSuppliers.length}`, 14, finalY + 10);

      // Save the PDF
      doc.save('suppliers-report.pdf');
      showSnackbar('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF', 'error');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/suppliers/download/excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'suppliers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      showSnackbar('Error downloading Excel file', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await supplierAPI.update(editingId, formData);
        showSnackbar('Supplier updated successfully');
      } else {
        await supplierAPI.create(formData);
        showSnackbar('Supplier added successfully');
      }
      fetchSuppliers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving supplier:', error);
      showSnackbar(error.response?.data?.message || 'Error saving supplier', 'error');
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address
    });
    setEditingId(supplier._id);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await supplierAPI.delete(id);
      fetchSuppliers();
      showSnackbar('Supplier deleted successfully');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showSnackbar('Error deleting supplier', 'error');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Suppliers Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Search suppliers..."
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
              onClick={() => {
                setIsEditing(false);
                setOpenDialog(true);
              }}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#f39c12',
                },
              }}
            >
              Add Supplier
            </Button>
          </Box>
        </Box>
      </Box>

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
            {filteredSuppliers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.address}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(supplier)}
                      sx={{ color: '#ff9f43' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(supplier._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSuppliers.length}
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ color: '#ff9f43', fontWeight: 600,borderBottom: '1px solid #e0e0e0',}} >{isEditing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#ff9f43', '&:hover': { backgroundColor: '#f39c12' } }}>
              {isEditing ? 'Update' : 'Add'} Supplier
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
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
}

export default Suppliers;