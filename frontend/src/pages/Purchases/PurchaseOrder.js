import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  TablePagination,
  FormHelperText,
  CircularProgress,
  
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { purchaseAPI, supplierAPI, cashInHandphAPI, cashInBankphAPI, cashInChequephAPI, productsAPI, accountPayableAPI, warehouseAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const PurchaseOrder = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    supplier: '',
    productId: '',
    product: '',
    brand: '',
    category: '',
    productPrice: '',
    quantity: '',
    total: '',
    warehouse: '',
    payment: {
      amount: '',
      paymentType: 'Cash',
      accountNumber: '',
      paymentNote: ''
    }
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes, warehousesRes] = await Promise.all([
        purchaseAPI.getAll(),
        supplierAPI.getAll(),
        warehouseAPI.getAll()
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        supplier: '',
        productId: '',
        product: '',
        brand: '',
        category: '',
        productPrice: '',
        quantity: '',
        total: '',
        warehouse: '',
        payment: {
          amount: '',
          paymentType: 'Cash',
          accountNumber: '',
          paymentNote: ''
        }
      });
      setEditMode(false);
      setEditId(null);
    }, 300); // Wait for dialog close animation
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('payment.')) {
      const paymentField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          [paymentField]: value
        }
      }));
    } else {
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: value
        };

        // If product price or quantity changes, recalculate total
        if ((name === 'productPrice' || name === 'quantity') && newFormData.productPrice && newFormData.quantity) {
          const price = parseFloat(newFormData.productPrice);
          const quantity = parseFloat(newFormData.quantity);
          if (!isNaN(price) && !isNaN(quantity)) {
            newFormData.total = (price * quantity).toFixed(2);
          }
        }

        return newFormData;
      });
    }
    // Debug log
    console.log('Input changed:', name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.supplier || !formData.productId || !formData.product || !formData.brand || !formData.category || !formData.productPrice || !formData.quantity || !formData.total) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate amounts
      const quantity = parseInt(formData.quantity);
      const total = parseFloat(formData.total);
      const paymentAmount = parseFloat(formData.payment.amount) || 0;
      const productPrice = parseFloat(formData.productPrice);

      if (quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }

      if (productPrice <= 0) {
        toast.error('Product price must be greater than 0');
        return;
      }

      if (total <= 0) {
        toast.error('Total amount must be greater than 0');
        return;
      }

      if (paymentAmount < 0) {
        toast.error('Payment amount cannot be negative');
        return;
      }

      if (paymentAmount > total) {
        toast.error('Payment amount cannot exceed total amount');
        return;
      }



      let productId;
      let response;

      if (editMode && editId) {
        // When editing, find the existing product
        const existingPurchase = purchases.find(p => p._id === editId);
        if (existingPurchase && existingPurchase.product) {
          // Update the existing product
          await productsAPI.update(existingPurchase.product._id, {
            productId: formData.productId,
            name: formData.product,
            brand: formData.brand,
            category: formData.category,
            productPrice: productPrice,
            stock: quantity
          });

          // Update the purchase order with correct data structure
          response = await purchaseAPI.update(editId, {
            date: formData.date,
            dueDate: formData.dueDate,
            supplier: formData.supplier,
            product: existingPurchase.product._id,
            warehouse: formData.warehouse,
            quantity: quantity,
            total: total,
            payments: paymentAmount > 0 ? [{
              amount: paymentAmount,
              paymentType: formData.payment.paymentType,
              accountNumber: formData.payment.accountNumber,
              paymentNote: formData.payment.paymentNote
            }] : []
          });

          console.log('Update response:', response.data);
          toast.success('Purchase order updated successfully');
        }
      } else {
        // Create new product first
        const productResponse = await productsAPI.create({
          productId: formData.productId,
          name: formData.product,
          brand: formData.brand,
          category: formData.category,
          description: 'Product added via Purchase Order',
          productPrice: productPrice,
          stock: quantity,
          warehouse: formData.warehouse
        });
        productId = productResponse.data._id;

        // Create the purchase order
        const purchaseData = {
          date: new Date(formData.date).toISOString(),
          dueDate: new Date(formData.dueDate).toISOString(),
          supplier: formData.supplier,
          product: productId,
          warehouse: formData.warehouse,
          quantity: quantity,
          total: total,
          payments: paymentAmount > 0 ? [{
            amount: paymentAmount,
            paymentType: formData.payment.paymentType,
            accountNumber: formData.payment.accountNumber,
            paymentNote: formData.payment.paymentNote
          }] : [],
          balance: total - paymentAmount
        };

        response = await purchaseAPI.create(purchaseData);
        toast.success('Purchase order created successfully');
      }

      // Get the created/updated purchase
      const newPurchase = response.data;

      // Only create cash entries and account payable for new purchases, not updates
      if (!editMode) {
        // If there's a payment, create corresponding cash entry
        if (paymentAmount > 0) {
          const selectedSupplier = suppliers.find(s => s._id === formData.supplier);

          const cashData = {
            date: formData.date,
            dueDate: formData.dueDate,
            orderId: newPurchase.orderId,
            supplier: selectedSupplier?.name || 'Unknown Supplier',
            product: formData.product,
            quantity: quantity,
            totalAmount: total,
            amountPaid: paymentAmount,
            balance: total - paymentAmount,
            paymentType: formData.payment.paymentType,
            accountNumber: formData.payment.accountNumber,
            paymentNote: formData.payment.paymentNote
          };

          // Create entry in appropriate cash collection based on payment type
          if (formData.payment.paymentType === 'Cash') {
            await cashInHandphAPI.create(cashData);
          } else if (formData.payment.paymentType === 'Bank') {
            await cashInBankphAPI.create(cashData);
          } else if (formData.payment.paymentType === 'Cheque') {
            await cashInChequephAPI.create(cashData);
          }
        }

        // Create account payable record for new purchases
        try {
          const selectedSupplier = suppliers.find(s => s._id === formData.supplier);
          if (selectedSupplier) {
            const payableData = {
              supplier: selectedSupplier.name,
              invoiceNumber: newPurchase.orderId,
              description: `Purchase order ${newPurchase.orderId}`,
              totalAmount: total,
              amountPaid: paymentAmount
            };

            await accountPayableAPI.create(payableData);
          }
        } catch (error) {
          console.error('Error handling account payable:', error);
          // Don't throw error here, just log it
        }
      } else {
        // For updates, handle cash entry updates
        console.log('Handling cash entry updates for purchase order:', newPurchase.orderId);
        try {
          const selectedSupplier = suppliers.find(s => s._id === formData.supplier);

          const cashData = {
            date: formData.date,
            dueDate: formData.dueDate,
            orderId: newPurchase.orderId,
            supplier: selectedSupplier?.name || 'Unknown Supplier',
            product: formData.product,
            quantity: quantity,
            totalAmount: total,
            amountPaid: paymentAmount,
            balance: total - paymentAmount,
            paymentType: formData.payment.paymentType,
            accountNumber: formData.payment.accountNumber,
            paymentNote: formData.payment.paymentNote
          };

          // Check both cash and bank APIs for existing entries
          let existingCashEntry = null;
          let currentApi = null;

          console.log('Searching for existing cash entries for orderId:', newPurchase.orderId);

          // Check cash in hand
          try {
            const cashResponse = await cashInHandphAPI.getAll();
            console.log('Cash in hand entries found:', cashResponse.data.length);
            existingCashEntry = cashResponse.data.find(entry => entry.orderId === newPurchase.orderId);
            if (existingCashEntry) {
              console.log('Found existing cash in hand entry:', existingCashEntry._id);
              currentApi = cashInHandphAPI;
            }
          } catch (error) {
            console.log('Error checking cash in hand entries:', error.message);
          }

          // Check cash in bank if not found in cash in hand
          if (!existingCashEntry) {
            try {
              const bankResponse = await cashInBankphAPI.getAll();
              console.log('Cash in bank entries found:', bankResponse.data.length);
              existingCashEntry = bankResponse.data.find(entry => entry.orderId === newPurchase.orderId);
              if (existingCashEntry) {
                console.log('Found existing cash in bank entry:', existingCashEntry._id);
                currentApi = cashInBankphAPI;
              }
            } catch (error) {
              console.log('Error checking cash in bank entries:', error.message);
            }
          }

          // Check cash in cheque if not found in cash in hand or bank
          if (!existingCashEntry) {
            try {
              const chequeResponse = await cashInChequephAPI.getAll();
              console.log('Cash in cheque entries found:', chequeResponse.data.length);
              existingCashEntry = chequeResponse.data.find(entry => entry.orderId === newPurchase.orderId);
              if (existingCashEntry) {
                console.log('Found existing cash in cheque entry:', existingCashEntry._id);
                currentApi = cashInChequephAPI;
              }
            } catch (error) {
              console.log('Error checking cash in cheque entries:', error.message);
            }
          }

          if (paymentAmount > 0) {
            let targetApi;
            if (formData.payment.paymentType === 'Bank') {
              targetApi = cashInBankphAPI;
            } else if (formData.payment.paymentType === 'Cheque') {
              targetApi = cashInChequephAPI;
            } else {
              targetApi = cashInHandphAPI;
            }
            console.log('Target payment type:', formData.payment.paymentType, 'Target API:',
              targetApi === cashInBankphAPI ? 'Bank' :
              targetApi === cashInChequephAPI ? 'Cheque' : 'Cash');

            if (existingCashEntry) {
              // If payment type changed, delete old entry and create new one
              if (currentApi !== targetApi) {
                console.log('Payment type changed, deleting old entry and creating new one');
                await currentApi.delete(existingCashEntry._id);
                await targetApi.create(cashData);
                console.log('Successfully switched payment type');
              } else {
                // Same payment type, just update
                console.log('Same payment type, updating existing entry');
                await currentApi.update(existingCashEntry._id, cashData);
                console.log('Successfully updated existing entry');
              }
            } else {
              // No existing entry, create new one
              console.log('No existing entry found, creating new one');
              await targetApi.create(cashData);
              console.log('Successfully created new cash entry');
            }
          } else {
            // Payment amount is 0, delete any existing cash entry
            console.log('Payment amount is 0, deleting any existing cash entry');
            if (existingCashEntry && currentApi) {
              await currentApi.delete(existingCashEntry._id);
              console.log('Successfully deleted existing cash entry');
            }
          }
        } catch (error) {
          console.error('Error updating cash entry:', error);
          // Don't throw error here, just log it
        }
      }

      await fetchInitialData();
      handleClose();
    } catch (error) {
      console.error('Error saving purchase:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });

      let errorMessage = 'Error saving purchase order';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleEdit = (purchase) => {
    const editData = {
      date: format(new Date(purchase.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(purchase.dueDate), 'yyyy-MM-dd'),
      supplier: purchase.supplier?._id || purchase.supplier || '',
      productId: purchase.product?.productId || '',
      product: purchase.product?.name || '',
      brand: purchase.product?.brand || '',
      category: purchase.product?.category || '',
      productPrice: purchase.product?.productPrice?.toString() || '',
      quantity: purchase.quantity?.toString() || '',
      total: purchase.total?.toString() || '',
      warehouse: purchase.warehouse?._id || purchase.warehouse || '',
      payment: {
        amount: purchase.payments?.[0]?.amount?.toString() || '',
        paymentType: purchase.payments?.[0]?.paymentType || 'Cash',
        accountNumber: purchase.payments?.[0]?.accountNumber || '',
        paymentNote: purchase.payments?.[0]?.paymentNote || ''
      }
    };
    
    setFormData(editData);
    setEditMode(true);
    setEditId(purchase._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        // First get the purchase details to know which payment entry to delete
        const purchase = purchases.find(p => p._id === id);
        if (!purchase) {
          throw new Error('Purchase not found');
        }

        // Delete the purchase order
        await purchaseAPI.delete(id);

        // If there was a payment, delete the corresponding payment entry
        if (purchase.payments?.[0]?.amount > 0) {
          let api;
          if (purchase.payments[0].paymentType === 'Bank') {
            api = cashInBankphAPI;
          } else if (purchase.payments[0].paymentType === 'Cheque') {
            api = cashInChequephAPI;
          } else {
            api = cashInHandphAPI;
          }

          // Find and delete the payment entry with matching orderId
          const paymentResponse = await api.getAll();
          const paymentEntry = paymentResponse.data.find(p => p.orderId === purchase.orderId);
          if (paymentEntry) {
            await api.delete(paymentEntry._id);
          }
        }

        toast.success('Purchase order deleted successfully');
        await fetchInitialData();
      } catch (error) {
        console.error('Error deleting purchase:', error);
        toast.error('Error deleting purchase. Please try again.');
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDateRange = true;
    if (fromDate && toDate) {
      const purchaseDate = new Date(purchase.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      matchesDateRange = purchaseDate >= from && purchaseDate <= to;
    }

    return matchesSearch && matchesDateRange;
  });

  const paginatedPurchases = filteredPurchases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleViewOpen = (purchase) => {
    setSelectedPurchase(purchase);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedPurchase(null);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(255, 159, 67);
      doc.text('Purchase Orders Report', 14, 22);

      // Add filters info
      doc.setFontSize(11);
      doc.setTextColor(100);
      let filterText = 'Filters: ';
      if (fromDate && toDate) {
        filterText += `Date Range: ${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`;
      }
      if (searchTerm) {
        filterText += ` | Search: ${searchTerm}`;
      }
      if (!fromDate && !toDate && !searchTerm) {
        filterText += 'None';
      }
      doc.text(filterText, 14, 30);

      // Prepare table data
      const tableColumn = [
        'Order ID', 'Date', 'Due Date', 'Supplier', 'Product',
        'Warehouse', 'Quantity', 'Total', 'Payment', 'Payment Type'
      ];

      const tableRows = [];
      filteredPurchases.forEach(purchase => {
        const purchaseData = [
          purchase.orderId || '-',
          format(new Date(purchase.date), 'dd/MM/yyyy'),
          format(new Date(purchase.dueDate), 'dd/MM/yyyy'),
          purchase.supplier?.name || '-',
          purchase.product?.name || '-',
          purchase.warehouse?.name || '-',
          purchase.quantity?.toString() || '0',
          `₹${purchase.total?.toFixed(2) || '0.00'}`,
          `₹${(purchase.payments?.[0]?.amount || 0).toFixed(2)}`,
          purchase.payments?.[0]?.paymentType || '-'
        ];
        tableRows.push(purchaseData);
      });

      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [255, 159, 67],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 15 },
          7: { cellWidth: 18 },
          8: { cellWidth: 18 },
          9: { cellWidth: 20 }
        }
      });

      // Add total amount
      const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
      const finalY = doc.lastAutoTable.finalY || 40;
      doc.setFontSize(12);
      doc.setTextColor(255, 159, 67);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, finalY + 10);

      // Save the PDF
      doc.save(`purchase-orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredPurchases.map(purchase => {
        return {
          'Order ID': purchase.orderId || '-',
          'Date': format(new Date(purchase.date), 'dd/MM/yyyy'),
          'Due Date': format(new Date(purchase.dueDate), 'dd/MM/yyyy'),
          'Supplier': purchase.supplier?.name || '-',
          'Product': purchase.product?.name || '-',
          'Brand': purchase.product?.brand || '-',
          'Category': purchase.product?.category || '-',
          'Warehouse': purchase.warehouse?.name || '-',
          'Quantity': purchase.quantity || 0,
          'Unit Price': purchase.product?.productPrice || 0,
          'Total Amount': purchase.total || 0,
          'Payment Amount': purchase.payments?.[0]?.amount || 0,
          'Payment Type': purchase.payments?.[0]?.paymentType || '-',
          'Balance': (purchase.total || 0) - (purchase.payments?.[0]?.amount || 0),
          'Payment Note': purchase.payments?.[0]?.paymentNote || ''
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');

      // Save the Excel file
      XLSX.writeFile(wb, `purchase-orders-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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
            Purchase Order Management
          </Typography>

          {/* Date Filter Section - Right Side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: '150px',
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
            <TextField
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: '150px',
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
              variant="outlined"
              size="small"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSearchTerm('');
              }}
              sx={{
                borderColor: '#ff9f43',
                color: '#ff9f43',
                '&:hover': {
                  borderColor: '#f39c12',
                  backgroundColor: '#fff3e0',
                },
                whiteSpace: 'nowrap'
              }}
            >
              CLEAR FILTERS
            </Button>
          </Box>
        </Box>

        {/* Search Bar and Action Buttons - Below Filter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#f39c12',
                },
              }}
            >
              ADD ORDER
            </Button>
          </Box>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ORDER ID</TableCell>
                <TableCell>DATE</TableCell>
                <TableCell>SUPPLIER</TableCell>
                <TableCell>PRODUCT</TableCell>
                <TableCell>CATEGORY</TableCell>
                <TableCell>WAREHOUSE</TableCell>
                <TableCell>QUANTITY</TableCell>
                <TableCell>TOTAL</TableCell>
                <TableCell>PAYMENT</TableCell>
                <TableCell>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#ff9f43' }} />
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                  <TableRow
                    key={purchase._id}
                    sx={{
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <TableCell>{purchase.orderId}</TableCell>
                    <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                 
                    <TableCell>{purchase.supplier?.name || 'N/A'}</TableCell>
                    <TableCell>{purchase.product?.name || 'N/A'}</TableCell>
                    <TableCell>{purchase.product?.category || 'N/A'}</TableCell>
                    <TableCell>{purchase.warehouse?.name || 'N/A'}</TableCell>
                    <TableCell>{purchase.quantity}</TableCell>
                    <TableCell>₹{purchase.total.toFixed(2)}</TableCell>
                    <TableCell>
                      ₹{(purchase.payments?.[0]?.amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewOpen(purchase)}
                        size="small"
                        sx={{ color: '#4299e1', mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleEdit(purchase)}
                        size="small"
                        sx={{ color: '#ff9f43', mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(purchase._id)}
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
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    {searchTerm || fromDate || toDate ? 'No purchases found matching the filters' : 'No purchases found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!loading && filteredPurchases.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPurchases.length}
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
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', color: '#ff9f43' }}>
          {editMode ? 'Edit Purchase Order' : 'Add New Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Due Date"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth required error={!formData.supplier}>
              <InputLabel>Supplier</InputLabel>
              <Select
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                label="Supplier"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
              {!formData.supplier && (
                <FormHelperText>Supplier is required</FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Product ID"
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              fullWidth
              required
              error={!formData.productId}
              helperText={!formData.productId ? 'Product ID is required' : ''}
            />
            <TextField
              label="Product Name"
              name="product"
              value={formData.product}
              onChange={handleInputChange}
              fullWidth
              required
              error={!formData.product}
              helperText={!formData.product ? 'Product name is required' : ''}
            />
            <TextField
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              fullWidth
              required
              error={!formData.brand}
              helperText={!formData.brand ? 'Brand is required' : ''}
            />
            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              fullWidth
              required
              error={!formData.category}
              helperText={!formData.category ? 'Category is required' : ''}
            />
            <FormControl fullWidth required error={!formData.warehouse}>
              <InputLabel>Warehouse</InputLabel>
              <Select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleInputChange}
                label="Warehouse"
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
              {!formData.warehouse && (
                <FormHelperText>Warehouse is required</FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Product Price"
              name="productPrice"
              type="number"
              value={formData.productPrice}
              onChange={handleInputChange}
              fullWidth
              required
              error={Boolean(!formData.productPrice || parseFloat(formData.productPrice) <= 0)}
              helperText={
                !formData.productPrice 
                  ? 'Product price is required' 
                  : parseFloat(formData.productPrice) <= 0 
                    ? 'Product price must be greater than 0' 
                    : ''
              }
              inputProps={{ min: 0.01, step: "0.01" }}
            />
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              fullWidth
              required
              error={Boolean(!formData.quantity || parseInt(formData.quantity) <= 0)}
              helperText={
                !formData.quantity 
                  ? 'Quantity is required' 
                  : parseInt(formData.quantity) <= 0 
                    ? 'Quantity must be greater than 0' 
                    : ''
              }
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Total Amount"
              name="total"
              type="number"
              value={formData.total}
              fullWidth
              required
              InputProps={{
                readOnly: true,
              }}
              helperText="Total is calculated automatically based on product price and quantity"
            />
            
            <Divider sx={{ my: 2 }}>Payment Details</Divider>
            
            <TextField
              label="Payment Amount"
              name="payment.amount"
              type="number"
              value={formData.payment.amount}
              onChange={handleInputChange}
              fullWidth
              error={Boolean(formData.payment.amount && parseFloat(formData.payment.amount) <= 0)}
              helperText={
                formData.payment.amount && parseFloat(formData.payment.amount) <= 0 
                  ? 'Payment amount must be greater than 0' 
                  : ''
              }
              inputProps={{ min: 0.01, step: "0.01" }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select
                name="payment.paymentType"
                value={formData.payment.paymentType}
                onChange={handleInputChange}
                label="Payment Type"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
            
            {formData.payment.paymentType === 'Bank' && (
              <TextField
                label="Account Number"
                name="payment.accountNumber"
                value={formData.payment.accountNumber}
                onChange={handleInputChange}
                fullWidth
                required
                error={Boolean(!formData.payment.accountNumber)}
                helperText={!formData.payment.accountNumber ? 'Account number is required for bank payments' : ''}
              />
            )}



            <TextField
              label="Payment Note"
              name="payment.paymentNote"
              multiline
              rows={2}
              value={formData.payment.paymentNote}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: '#ff9f43', borderColor: '#ff9f43', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#ff9f43' } }}>Cancel</Button>
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
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={viewDialogOpen} 
        onClose={handleViewClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            '& .MuiDialogTitle-root': {
              backgroundColor: '#ff9800',
              color: 'white',
              fontWeight: 'bold'
            }
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Purchase Order Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPurchase && (
            <Box sx={{ '& > *': { my: 2 } }}>
              {/* Order Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ff9800', mb: 1, fontWeight: 'bold' }}>Order Information</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Order ID:</strong> {selectedPurchase.orderId}</Typography>
                  <Typography><strong>Date:</strong> {format(new Date(selectedPurchase.date), 'dd/MM/yyyy')}</Typography>
                  <Typography><strong>Due Date:</strong> {format(new Date(selectedPurchase.dueDate), 'dd/MM/yyyy')}</Typography>
                  <Typography><strong>Supplier:</strong> {selectedPurchase.supplier?.name || selectedPurchase.supplier}</Typography>
                  <Typography><strong>Status:</strong> {selectedPurchase.payment?.amount >= selectedPurchase.total ? 'Paid' : 'Pending'}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#ff9800' }} />

              {/* Product Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ff9800', mb: 1, fontWeight: 'bold' }}>Product Details</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Name:</strong> {selectedPurchase.product?.name || selectedPurchase.product}</Typography>
                  <Typography><strong>Brand:</strong> {selectedPurchase.product?.brand || selectedPurchase.brand}</Typography>
                  <Typography><strong>Category:</strong> {selectedPurchase.product?.category || 'N/A'}</Typography>
                  <Typography><strong>Product ID:</strong> {selectedPurchase.product?.productId || 'N/A'}</Typography>
                  <Typography><strong>Unit Price:</strong> ₹{selectedPurchase.productPrice?.toFixed(2)}</Typography>
                  <Typography><strong>Quantity:</strong> {selectedPurchase.quantity} units</Typography>
                  <Typography><strong>Total Amount:</strong> ₹{selectedPurchase.total?.toFixed(2)}</Typography>
                  <Typography><strong>Warehouse:</strong> {selectedPurchase.warehouse?.name || 'N/A'}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#ff9800' }} />

              {/* Payment Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ff9800', mb: 1, fontWeight: 'bold' }}>Payment Details</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Amount Paid:</strong> ₹{selectedPurchase.payment?.amount?.toFixed(2) || '0.00'}</Typography>
                  <Typography><strong>Payment Type:</strong> {selectedPurchase.payment?.paymentType || 'Not Specified'}</Typography>
                  {selectedPurchase.payment?.accountNumber && (
                    <Typography><strong>Account Number:</strong> {selectedPurchase.payment.accountNumber}</Typography>
                  )}
                  {selectedPurchase.payment?.paymentNote && (
                    <Typography><strong>Payment Note:</strong> {selectedPurchase.payment.paymentNote}</Typography>
                  )}
                  <Typography sx={{ 
                    mt: 1, 
                    p: 1, 
                    bgcolor: '#fff3e0', 
                    borderRadius: 1,
                    border: '1px solid #ff9800'
                  }}>
                    <strong>Balance Due:</strong> ₹{(selectedPurchase.total - (selectedPurchase.payment?.amount || 0)).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Additional Information */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#ff9800', mb: 1, fontWeight: 'bold' }}>Additional Information</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Created At:</strong> {format(new Date(selectedPurchase.createdAt || selectedPurchase.date), 'dd/MM/yyyy HH:mm')}</Typography>
                  <Typography><strong>Last Updated:</strong> {selectedPurchase.updatedAt ? format(new Date(selectedPurchase.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#fff3e0', p: 2 }}>
          <Button 
            onClick={handleViewClose}
            variant="contained"
            sx={{ 
              bgcolor: '#ff9800',
              '&:hover': {
                bgcolor: '#f57c00'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseOrder; 
