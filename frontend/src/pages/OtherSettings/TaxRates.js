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

function TaxRates() {
  const { darkMode } = useTheme();
  const [taxRates, setTaxRates] = useState([
    {
      id: 1,
      name: 'GST',
      percentage: 18,
      description: 'Goods and Services Tax'
    },
    {
      id: 2,
      name: 'VAT',
      percentage: 12,
      description: 'Value Added Tax'
    }
  ]);
  const [open, setOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    percentage: '',
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
    const exportData = taxRates.map(tax => ({
      'Name': tax.name,
      'Percentage': `${tax.percentage}%`,
      'Description': tax.description
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tax Rates');
    XLSX.writeFile(wb, 'tax_rates.xlsx');
    toast.success('Excel file downloaded successfully');
  };

  // Function to export data as PDF
  const handleExportPDF = () => {
    try {
      // Initialize jsPDF
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(15);
      doc.text('Tax Rates Report', 14, 15);

      // Define the table
      const tableColumn = ['Name', 'Percentage', 'Description'];
      const tableRows = taxRates.map(tax => [
        tax.name,
        `${tax.percentage}%`,
        tax.description
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
      doc.save('tax_rates.pdf');
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleOpen = (tax = null) => {
    if (tax) {
      setEditingTax(tax);
      setFormData({
        name: tax.name,
        percentage: tax.percentage.toString(),
        description: tax.description
      });
    } else {
      setEditingTax(null);
      setFormData({
        name: '',
        percentage: '',
        description: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTax(null);
    setFormData({
      name: '',
      percentage: '',
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
    if (!formData.name || !formData.percentage) {
      toast.error('Please fill in all required fields');
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }

    if (editingTax) {
      // Update existing tax rate
      setTaxRates(prev => prev.map(tax => 
        tax.id === editingTax.id 
          ? { ...tax, name: formData.name, percentage, description: formData.description }
          : tax
      ));
      toast.success('Tax rate updated successfully');
    } else {
      // Add new tax rate
      const newTax = {
        id: Date.now(),
        name: formData.name,
        percentage,
        description: formData.description
      };
      setTaxRates(prev => [...prev, newTax]);
      toast.success('Tax rate added successfully');
    }

    handleClose();
  };

  const handleDelete = (id) => {
    setTaxRates(prev => prev.filter(tax => tax.id !== id));
    toast.success('Tax rate deleted successfully');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9f43' }}>
          Tax Rates
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
            Add Tax Rate
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
                Percentage
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
            {taxRates
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((tax) => (
              <TableRow key={tax.id} sx={{ '&:hover': { backgroundColor: darkMode ? '#333333' : '#f9f9f9' } }}>
                <TableCell sx={{ color: darkMode ? '#ff9f43' : '#000000' }}>
                  {tax.name}
                </TableCell>
                <TableCell sx={{ color: darkMode ? '#ff9f43' : '#000000' }}>
                  <Chip 
                    label={`${tax.percentage}%`} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#ff9f43', 
                      color: 'white',
                      fontWeight: 500
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ color: darkMode ? '#ffffff' : '#000000' }}>
                  {tax.description}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpen(tax)}
                    sx={{ color: '#ff9f43', mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(tax.id)}
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
          count={taxRates.length}
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
          {editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}
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
          <TextField
            margin="dense"
            name="percentage"
            label="Percentage"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.percentage}
            onChange={handleInputChange}
            required
            inputProps={{ min: 0, max: 100, step: 0.01 }}
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
            {editingTax ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TaxRates;
