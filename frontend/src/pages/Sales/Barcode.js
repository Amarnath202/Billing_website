import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Select,
  MenuItem,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Paper,
  Container,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  ClickAwayListener,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const BARCODE_SIZES = [
  { value: '1', label: '1 Labels (100 × 50mm)' },
  { value: '2', label: '2 Labels (50 × 25mm)' },
  { value: '3', label: '3 Labels (38 × 25mm)' },
];

const BARCODE_FORMATS = [
  { value: 'CODE128', label: 'Code 128' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'CODE39', label: 'Code 39' },
];

function Barcode() {
  // State for barcode generation
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [size, setSize] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for products and search
  const [products, setProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Refs for print functionality
  const printFrameRef = useRef(null);

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products');
      }
    };
    
    fetchProducts();
  }, []);
  
  // Create memoized search function
  const searchProducts = useCallback(async (query, products) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Search in local products first
      const results = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(query.toLowerCase()) ||
          (product.barcode && product.barcode.toString().includes(query))
      );
      
      // If no local results, try API search
      if (results.length === 0) {
        try {
          const response = await api.get(`/barcode/products?search=${encodeURIComponent(query)}`);
          setSearchResults(response.data);
          setShowSearchResults(response.data.length > 0);
        } catch (error) {
          console.error('Error searching products:', error);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } else {
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      }
    } catch (error) {
      console.error('Error in search:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [setSearchResults]);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      setShowSearchResults(true);
      const timeoutId = setTimeout(() => {
        searchProducts(value, products);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  
  // Handle adding a product to the barcode list
  const handleAddProduct = (product) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            _id: product._id,
            name: product.name,
            barcode: product.barcode || `PRD-${product._id}`,
            price: product.productPrice || 0,
            quantity: 1,
            barcodeUrl: `${API_URL}/barcode/product/${product._id}?format=${barcodeFormat}&width=3&height=100`
          }
        ];
      }
    });
    
    setSearchResults([]);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item._id !== id));
  };

  const handleQuantityChange = (id, quantity) => {
    const newQuantity = Math.max(1, parseInt(quantity) || 1);
    setItems(items.map(item => 
      item._id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleGenerate = async () => {
    if (items.length === 0) {
      setError('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      // Update barcodeUrls with current format and size parameters
      const updatedItems = items.map(item => ({
        ...item,
        barcodeUrl: `${API_URL}/barcode/product/${item._id}?format=${barcodeFormat}&width=3&height=100`
      }));
      setItems(updatedItems);
      
      // Prepare print view with fixed dimensions
      const printWindow = printFrameRef.current.contentWindow;
      const printContent = `
        <html>
          <head>
            <title>Barcodes</title>
            <style>
              @page {
                size: ${size === '1' ? 'A4 landscape' : 'A4 portrait'};
                margin: 0;
              }
              body { 
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: white;
                width: ${size === '1' ? '297mm' : '210mm'};
                height: ${size === '1' ? '210mm' : '297mm'};
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .barcode-container {
                display: grid;
                grid-template-columns: repeat(${size === '1' ? '2' : '3'}, 1fr);
                gap: 10mm;
                padding: 10mm;
                background: white;
                width: calc(100% - 20mm);
                height: calc(100% - 20mm);
                box-sizing: border-box;
              }
              .barcode-item {
                text-align: center;
                padding: 5mm;
                page-break-inside: avoid;
                border: 1px solid #ddd;
                border-radius: 2mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: white;
                box-sizing: border-box;
                aspect-ratio: ${size === '1' ? '2/1' : '1/1'};
              }
              .barcode-item img {
                max-width: 90%;
                height: auto;
                margin-bottom: 2mm;
                image-rendering: -webkit-optimize-contrast;
              }
              .barcode-item .name {
                margin-top: 1mm;
                font-size: 10pt;
                color: #333;
                font-weight: 500;
                word-break: break-word;
              }
              .barcode-item .price {
                margin-top: 1mm;
                font-size: 12pt;
                font-weight: bold;
                color: #000;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${updatedItems.map(item => 
                Array(item.quantity).fill().map(() => `
                  <div class="barcode-item">
                    <img 
                      src="${item.barcodeUrl}" 
                      alt="${item.name}"
                      crossorigin="anonymous"
                      onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+RXJyb3IgbG9hZGluZyBiYXJjb2RlPC90ZXh0Pjwvc3ZnPg=='"
                    />
                    <div class="name">${item.name}</div>
                    <div class="price">₹${item.price.toFixed(2)}</div>
                  </div>
                `).join('')
              ).join('')}
            </div>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for the content to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error generating barcodes:', error);
      setError('Failed to generate barcodes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (printFrameRef.current) {
      printFrameRef.current.contentWindow.print();
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Generate Barcode Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Generate Barcode
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Barcode Type</InputLabel>
              <Select
                value={barcodeFormat}
                onChange={(e) => setBarcodeFormat(e.target.value)}
                label="Barcode Type"
              >
                {BARCODE_FORMATS.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Size</InputLabel>
              <Select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                label="Size"
              >
                {BARCODE_SIZES.map((size) => (
                  <MenuItem key={size.value} value={size.value}>
                    {size.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <ClickAwayListener onClickAway={() => setShowSearchResults(false)}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  placeholder="Search by name or barcode"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                {showSearchResults && searchResults.length > 0 && (
                  <Paper 
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      mt: 1,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {searchResults.map((product) => (
                      <Box 
                        key={product._id}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                        onClick={() => handleAddProduct(product)}
                      >
                        <Typography variant="body2">{product.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {product.barcode || product.productId}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>
          </Grid>
        </Grid>

        {/* Items Table */}
        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ACTION</TableCell>
                <TableCell>ITEM</TableCell>
                <TableCell>BARCODE</TableCell>
                <TableCell>SALE PRICE</TableCell>
                <TableCell>QTY</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No items added yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteItem(item._id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.barcode}</TableCell>
                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                        size="small"
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Typography>Total Items: {totalItems}</Typography>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || items.length === 0}
            startIcon={<QrCodeIcon />}
          >
            Generate
          </Button>
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={loading || items.length === 0}
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
        </Box>
      </Paper>

      {/* Hidden print frame */}
      <iframe
        ref={printFrameRef}
        style={{ display: 'none' }}
        title="Print Frame"
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Barcode;
