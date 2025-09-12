import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Divider,
  Container,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { warehouseAPI, brandAPI, categoryAPI } from '../../services/api';

const API_URL = 'http://localhost:5001/api';

// Simplified print styles
const PrintStyles = styled('style')({
  '@media print': {
    '@page': {
      margin: '10mm',
      size: '80mm 297mm'  // Standard thermal receipt size
    },
    'body *': {
      visibility: 'hidden'
    },
    '#receipt-print-section, #receipt-print-section *': {
      visibility: 'visible'
    },
    '#receipt-print-section': {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%'
    }
  }
});

function Billing() {
  const [billNumber, setBillNumber] = useState(`BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tax and Discount states
  const [selectedTax, setSelectedTax] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [taxRates] = useState([
    { id: 1, name: 'GST', percentage: 18, description: 'Goods and Services Tax' },
    { id: 2, name: 'VAT', percentage: 12, description: 'Value Added Tax' },
    { id: 3, name: 'No Tax', percentage: 0, description: 'No Tax Applied' }
  ]);
  const [discounts] = useState([
    { id: 1, name: 'Early Bird', type: 'percentage', value: 10, description: 'Early payment discount' },
    { id: 2, name: 'Bulk Order', type: 'fixed', value: 500, description: 'Discount for bulk orders' },
    { id: 3, name: 'No Discount', type: 'percentage', value: 0, description: 'No Discount Applied' }
  ]);

  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      let availableProducts = response.data.filter(product => product.stock > 0);

      // Apply filters based on selected warehouse, brand, and category
      if (selectedWarehouse) {
        availableProducts = availableProducts.filter(product =>
          product.warehouse && product.warehouse._id === selectedWarehouse
        );
      }
      if (selectedBrand) {
        availableProducts = availableProducts.filter(product => product.brand === selectedBrand);
      }
      if (selectedCategory) {
        availableProducts = availableProducts.filter(product => product.category === selectedCategory);
      }

      setProducts(availableProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, selectedBrand, selectedCategory]);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
    fetchBrands();
    fetchCategories();
  }, [fetchProducts]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll();
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) {
      alert('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    if (!product) {
      alert('Selected product not found');
      return;
    }

    if (parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (parseInt(quantity) > product.stock) {
      alert(`Only ${product.stock} items available in stock`);
      return;
    }

    const existingItem = items.find(item => item.productId === product._id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + parseInt(quantity);
      if (newQuantity > product.stock) {
        alert(`Cannot add more items. Total quantity (${newQuantity}) exceeds available stock (${product.stock})`);
        return;
      }
      
      setItems(items.map(item => 
        item.productId === product._id 
          ? { 
              ...item, 
              quantity: newQuantity,
              total: product.productPrice * newQuantity 
            }
          : item
      ));
    } else {
      const newItem = {
        id: Date.now(),
        productId: product._id,
        product: product.name,
        brand: product.brand,
        category: product.category,
        warehouse: product.warehouse ? product.warehouse.name : '',
        quantity: parseInt(quantity),
        price: product.productPrice,
        total: product.productPrice * parseInt(quantity)
      };
      setItems([...items, newItem]);
    }

    setSelectedProduct('');
    setQuantity('');
  };

  // Handle filter changes
  const handleWarehouseChange = (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    setSelectedProduct(''); // Reset product selection when warehouse changes
  };

  const handleBrandChange = (brandName) => {
    setSelectedBrand(brandName);
    setSelectedProduct(''); // Reset product selection when brand changes
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedProduct(''); // Reset product selection when category changes
  };

  // Re-fetch products when filters change
  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [selectedWarehouse, selectedBrand, selectedCategory, loading, fetchProducts]);

  const handleResetFilters = () => {
    setSelectedWarehouse('');
    setSelectedBrand('');
    setSelectedCategory('');
    setSelectedProduct('');
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTaxAmount = () => {
    if (!selectedTax) return 0;
    const taxRate = taxRates.find(tax => tax.id === selectedTax);
    if (!taxRate) return 0;
    return (calculateSubtotal() * taxRate.percentage) / 100;
  };

  const calculateDiscountAmount = () => {
    if (!selectedDiscount) return 0;
    const discount = discounts.find(disc => disc.id === selectedDiscount);
    if (!discount) return 0;

    if (discount.type === 'percentage') {
      return (calculateSubtotal() * discount.value) / 100;
    } else {
      return discount.value;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = calculateTaxAmount();
    const discountAmount = calculateDiscountAmount();
    return subtotal + taxAmount - discountAmount;
  };

  const calculateTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Please add items to the bill');
      return;
    }

    try {
      const saleData = {
        billNumber,
        date: new Date().toISOString(),
        items: items.map(item => ({
          productId: item.productId,
          product: item.product,
          brand: item.brand,
          category: item.category,
          warehouse: item.warehouse,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: calculateSubtotal(),
        taxId: selectedTax,
        taxAmount: calculateTaxAmount(),
        discountId: selectedDiscount,
        discountAmount: calculateDiscountAmount(),
        totalAmount: calculateTotal()
      };

      // Save the sale
      const response = await axios.post(`${API_URL}/sales`, saleData);

      if (response.data) {
        alert('Sale saved successfully!');
        fetchProducts(); // Refresh products to update stock
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert(error.response?.data?.message || 'Error saving sale');
    }
  };

  const handleNew = () => {
    // Reset the form for a new bill
    setItems([]);
    setSelectedProduct('');
    setQuantity('');
    setSelectedTax('');
    setSelectedDiscount('');
    handleResetFilters();
    // Generate new bill number
    const newBillNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setBillNumber(newBillNumber);
    setDate(new Date().toISOString().split('T')[0]);
    alert('New bill created successfully!');
  };

  // Add barcode scanning functionality
  const onScanSuccess = async (decodedText) => {
    try {
      const cleanBarcode = decodedText.trim();
      console.log('Scanned barcode:', cleanBarcode);
      
      // Search for product by barcode
      const response = await axios.get(`${API_URL}/products/search/barcode/${encodeURIComponent(cleanBarcode)}`);
      console.log('Product found:', response.data);
      
      if (response.data) {
        const product = response.data;
        // Add the scanned product to the items list
        const existingItem = items.find(item => item.productId === product._id);
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > product.stock) {
            setError(`Cannot add more items. Total quantity (${newQuantity}) exceeds available stock (${product.stock})`);
            return;
          }
          
          setItems(items.map(item => 
            item.productId === product._id 
              ? { 
                  ...item, 
                  quantity: newQuantity,
                  total: product.productPrice * newQuantity 
                }
              : item
          ));
        } else {
          const newItem = {
            id: Date.now(),
            productId: product._id,
            product: product.name,
            brand: product.brand,
            category: product.category,
            warehouse: product.warehouse ? product.warehouse.name : '',
            quantity: 1,
            price: product.productPrice,
            total: product.productPrice
          };
          setItems([...items, newItem]);
        }
        setError('');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      const errorMessage = error.response?.data?.message || 'Error searching for product';
      const searchValue = error.response?.data?.searchValue;
      setError(searchValue ? `${errorMessage} (${searchValue})` : errorMessage);
    }
  };

  const onScanError = (error) => {
    console.warn(error);
  };

  const handleScanClick = () => {
    if (showScanner) {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      setShowScanner(false);
    } else {
      setShowScanner(true);
      setError('');
      // Initialize scanner when button is clicked
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner('reader', {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 5,
        });
        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
      }, 100);
    }
  };

  const handleCloseScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setShowScanner(false);
  };

  // Effect to clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const handlePrint = () => {
    if (items.length === 0) {
      alert('Please add items to the bill before printing');
      return;
    }

    window.print();
  };

  return (
    <>
      <PrintStyles />
      
      {/* Receipt Print Section */}
      <div id="receipt-print-section" style={{ display: 'none', fontFamily: 'monospace', fontSize: '12px', width: '80mm', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>SALES RECEIPT</div>
          <div>Bill No: {billNumber}</div>
          <div>Date: {new Date(date).toLocaleDateString()}</div>
          <div>Time: {new Date().toLocaleTimeString()}</div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          {/* Items Table */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '5px' }}>
            {'Product'.padEnd(20)} {'Brand'.padEnd(10)} {'Qty'.padEnd(5)} {'Price'.padEnd(8)} {'Total'.padEnd(10)}
          </div>
          {items.map((item, index) => (
            <div key={index} style={{ fontSize: '11px', whiteSpace: 'pre' }}>
              {item.product.substring(0, 20).padEnd(20)}
              {item.brand.substring(0, 10).padEnd(10)}
              {item.quantity.toString().padEnd(5)}
              {`₹${item.price.toFixed(2)}`.padEnd(8)}
              {`₹${item.total.toFixed(2)}`.padEnd(10)}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax:</span>
            <span>₹{calculateTaxAmount().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span>
            <span>-₹{calculateDiscountAmount().toFixed(2)}</span>
          </div>
          <div style={{ borderTop: '1px dashed #000', marginTop: '5px', paddingTop: '5px', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TOTAL:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
          Thank you for your business!
        </div>
      </div>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }} className="no-print">
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
            Retailer Invoice Management
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Bill Information Card */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bill Number"
                    value={billNumber}
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        color: '#ff9f43',
                        WebkitTextFillColor: '#ff9f43',
                        fontWeight: 500
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Filter Selection Card */}
          <Grid item xs={12} className="no-print">
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>
                  Filter Products
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleResetFilters}
                  sx={{
                    color: '#ff9f43',
                    borderColor: '#ff9f43',
                    '&:hover': {
                      borderColor: '#f39c12'
                    }
                  }}
                >
                  Reset Filters
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Warehouse</InputLabel>
                    <Select
                      value={selectedWarehouse}
                      onChange={(e) => handleWarehouseChange(e.target.value)}
                      label="Select Warehouse"
                    >
                      <MenuItem value="">All Warehouses</MenuItem>
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse._id} value={warehouse._id}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Brand</InputLabel>
                    <Select
                      value={selectedBrand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      label="Select Brand"
                    >
                      <MenuItem value="">All Brands</MenuItem>
                      {brands.map((brand) => (
                        <MenuItem key={brand._id} value={brand.name}>
                          {brand.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      label="Select Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Product Selection Card */}
          <Grid item xs={12} className="no-print">
            <Paper elevation={2} sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Product</InputLabel>
                    <Select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      label="Select Product"
                    >
                      <MenuItem value="" disabled>
                        {loading ? 'Loading products...' : 'Select a product'}
                      </MenuItem>
                      {products.map((product) => (
                        <MenuItem key={product._id} value={product._id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body1">{product.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {product.brand} • {product.category}
                                {product.warehouse && ` • ${product.warehouse.name}`}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={`₹${product.productPrice.toFixed(2)}`}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={`Stock: ${product.stock}`}
                                size="small"
                                color="success"
                              />
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddItem}
                    startIcon={<ShoppingCart />}
                    sx={{
                      height: '56px',
                      backgroundColor: '#ff9f43',
                      '&:hover': { backgroundColor: '#f39c12' }
                    }}
                  >
                    Add Item
                  </Button>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleScanClick}
                    startIcon={<QrCodeIcon />}
                    sx={{
                      height: '56px',
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#388e3c' }
                    }}
                  >
                    {showScanner ? 'Stop Scan' : 'Scan Barcode'}
                  </Button>
                </Grid>
              </Grid>

              {/* Scanner Dialog */}
              <Dialog
                open={showScanner}
                onClose={handleCloseScan}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Scan Barcode</DialogTitle>
                <DialogContent>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <div id="reader"></div>
                  </Box>
                  {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseScan} color="primary">
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
          </Grid>

          {/* Tax and Discount Selection Card */}
          <Grid item xs={12} className="no-print">
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600, mb: 2 }}>
                Tax & Discount
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Tax</InputLabel>
                    <Select
                      value={selectedTax}
                      onChange={(e) => setSelectedTax(e.target.value)}
                      label="Select Tax"
                    >
                      <MenuItem value="">No Tax</MenuItem>
                      {taxRates.map((tax) => (
                        <MenuItem key={tax.id} value={tax.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body1">{tax.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {tax.description}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${tax.percentage}%`}
                              size="small"
                              sx={{
                                backgroundColor: '#ff9f43',
                                color: 'white',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Discount</InputLabel>
                    <Select
                      value={selectedDiscount}
                      onChange={(e) => setSelectedDiscount(e.target.value)}
                      label="Select Discount"
                    >
                      <MenuItem value="">No Discount</MenuItem>
                      {discounts.map((discount) => (
                        <MenuItem key={discount.id} value={discount.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body1">{discount.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {discount.description}
                              </Typography>
                            </Box>
                            <Chip
                              label={discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                              size="small"
                              sx={{
                                backgroundColor: discount.type === 'percentage' ? '#4caf50' : '#2196f3',
                                color: 'white',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Bill Items Table */}
          <Grid item xs={12}>
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PRODUCT</TableCell>
                      <TableCell>BRAND</TableCell>
                      <TableCell>CATEGORY</TableCell>
                      <TableCell>WAREHOUSE</TableCell>
                      <TableCell>PRICE</TableCell>
                      <TableCell>QUANTITY</TableCell>
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="no-print">ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            No items added to the bill yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{item.product}</TableCell>
                          <TableCell>{item.brand}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.warehouse}</TableCell>
                          <TableCell>₹{item.price.toFixed(2)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.total.toFixed(2)}</TableCell>
                          <TableCell className="no-print">
                            <IconButton
                              onClick={() => handleRemoveItem(item.id)}
                              size="small"
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Bill Summary and Actions */}
          <Grid item xs={12} className="no-print">
            <Paper elevation={2} sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Items
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 500 }}>
                        {calculateTotalItems()}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 500 }}>
                        ₹{calculateSubtotal().toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Tax
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 500 }}>
                        ₹{calculateTaxAmount().toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Discount
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 500 }}>
                        -₹{calculateDiscountAmount().toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Grand Total
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>
                        ₹{calculateTotal().toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', md: 'flex-end' }
                  }}>
                    <Button
                      variant="contained"
                      onClick={handleNew}
                      sx={{
                        height: '40px',
                        minWidth: { xs: '70px', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        backgroundColor: '#6c757d',
                        color: 'white',
                        '&:hover': { backgroundColor: '#5a6268' }
                      }}
                    >
                      New
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handlePrint}
                      startIcon={<PrintIcon />}
                      sx={{
                        height: '40px',
                        minWidth: { xs: '70px', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        '&:hover': { backgroundColor: '#357abd' }
                      }}
                    >
                      Print
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      sx={{
                        height: '40px',
                        minWidth: { xs: '70px', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        backgroundColor: '#28a745',
                        color: 'white',
                        '&:hover': { backgroundColor: '#1e7e34' }
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default Billing;