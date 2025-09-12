import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

function Discount() {
  const { darkMode } = useTheme();
  const [discounts, setDiscounts] = useState([
    {
      id: 1,
      name: 'Early Bird',
      type: 'percentage',
      value: 10,
      description: 'Early payment discount'
    },
    {
      id: 2,
      name: 'Bulk Order',
      type: 'fixed',
      value: 500,
      description: 'Discount for bulk orders'
    }
  ]);
  const [open, setOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    description: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to export data as Excel
  const handleExportExcel = () => {
    const exportData = discounts.map(discount => ({
      'Name': discount.name,
      'Type': discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount',
      'Value': discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`,
      'Description': discount.description
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Discounts');
    XLSX.writeFile(wb, 'discounts.xlsx');
    toast.success('Excel file downloaded successfully');
  };

  // Function to export data as PDF
  const handleExportPDF = () => {
    try {
      // Initialize jsPDF
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(15);
      doc.text('Discounts Report', 14, 15);

      // Define the table
      const tableColumn = ['Name', 'Type', 'Value', 'Description'];
      const tableRows = discounts.map(discount => [
        discount.name,
        discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount',
        discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`,
        discount.description
      ]);

      // Generate the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [255, 159, 67],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 25 },
      });

      // Save the PDF
      doc.save('discounts.pdf');
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleOpen = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        name: discount.name,
        type: discount.type,
        value: discount.value.toString(),
        description: discount.description
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        name: '',
        type: 'percentage',
        value: '',
        description: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDiscount(null);
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      description: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    if (formData.type === 'percentage' && value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (editingDiscount) {
      // Update existing discount
      setDiscounts(prev => prev.map(discount => 
        discount.id === editingDiscount.id 
          ? { ...discount, name: formData.name, type: formData.type, value, description: formData.description }
          : discount
      ));
      toast.success('Discount updated successfully');
    } else {
      // Add new discount
      const newDiscount = {
        id: Date.now(),
        name: formData.name,
        type: formData.type,
        value,
        description: formData.description
      };
      setDiscounts(prev => [...prev, newDiscount]);
      toast.success('Discount added successfully');
    }

    handleClose();
  };

  const handleDelete = (id) => {
    setDiscounts(prev => prev.filter(discount => discount.id !== id));
    toast.success('Discount deleted successfully');
  };

  const formatDiscountValue = (discount) => {
    return discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9f43' }}>
          Discount Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
            sx={{
              backgroundColor: '#4caf50',
              color: 'white',
              '&:hover': {
                backgroundColor: '#388e3c',
              },
            }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<ExcelIcon />}
            onClick={handleExportExcel}
            sx={{
              backgroundColor: '#2196f3',
              color: 'white',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
            }}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              backgroundColor: '#ff9f43',
              color: 'white',
              '&:hover': {
                backgroundColor: '#e8890a',
              },
            }}
          >
            Add Discount
          </Button>
        </Box>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: darkMode ? '#333333' : '#f5f5f5' }}>
              <TableCell sx={{ 
                fontWeight: 600, 
                fontSize: '14px',
                color: darkMode ? '#ffffff' : '#ff9f43'
              }}>
                Name
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                fontSize: '14px',
                color: darkMode ? '#ffffff' : '#ff9f43'
              }}>
                Type
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                fontSize: '14px',
                color: darkMode ? '#ffffff' : '#ff9f43'
              }}>
                Value
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                fontSize: '14px',
                color: darkMode ? '#ffffff' : '#ff9f43'
              }}>
                Description
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                fontSize: '14px',
                color: darkMode ? '#ffffff' : '#ff9f43'
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discounts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((discount) => (
              <TableRow key={discount.id} sx={{ '&:hover': { backgroundColor: darkMode ? '#333333' : '#f9f9f9' } }}>
                <TableCell sx={{ color: darkMode ? '#ff9f43' : '#000000' }}>
                  {discount.name}
                </TableCell>
                <TableCell sx={{ color: darkMode ? '#ff9f43' : '#000000' }}>
                  <Chip 
                    label={discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'} 
                    size="small" 
                    sx={{ 
                      backgroundColor: discount.type === 'percentage' ? '#4caf50' : '#2196f3', 
                      color: 'white',
                      fontWeight: 500
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ color: darkMode ? '#ff9f43' : '#000000' }}>
                  <Chip 
                    label={formatDiscountValue(discount)} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#ff9f43', 
                      color: 'white',
                      fontWeight: 500
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ color: darkMode ? '#ffffff' : '#000000' }}>
                  {discount.description}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpen(discount)}
                    sx={{ color: '#ff9f43', mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(discount.id)}
                    sx={{ color: '#f44336' }}
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
          count={discounts.length}
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
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          color: '#ff9f43',
          fontWeight: 600
        }}>
          {editingDiscount ? 'Edit Discount' : 'Add Discount'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              label="Type"
            >
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="fixed">Fixed Amount</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="value"
            label={formData.type === 'percentage' ? 'Percentage' : 'Amount'}
            type="number"
            fullWidth
            variant="outlined"
            value={formData.value}
            onChange={handleInputChange}
            required
            inputProps={{ 
              min: 0, 
              max: formData.type === 'percentage' ? 100 : undefined,
              step: formData.type === 'percentage' ? 0.01 : 1
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleClose}
            sx={{ color: darkMode ? '#ffffff' : '#666666' }}
          >
            Close
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#ff9f43',
              color: 'white',
              '&:hover': {
                backgroundColor: '#e8890a',
              },
            }}
          >
            {editingDiscount ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Discount;
