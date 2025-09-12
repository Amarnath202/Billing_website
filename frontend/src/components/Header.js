import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Menu,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Apps as AppsIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';

function Header() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [gridMenuAnchorEl, setGridMenuAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const isGridMenuOpen = Boolean(gridMenuAnchorEl);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);

  // Load user data on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Close the menu
    setUserMenuAnchorEl(null);
    
    // Redirect to login page
    navigate('/login');
  };

  const handleAddPurchase = () => {
    navigate('/purchase-order');
  };

  const handleAddSale = () => {
    navigate('/sales-order');
  };

  const handleInvoice = () => {
    navigate('/billing');
  };

  const handleGridMenuClick = (event) => {
    setGridMenuAnchorEl(event.currentTarget);
  };

  const handleGridMenuClose = () => {
    setGridMenuAnchorEl(null);
  };

  const handleUserMenuClick = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleGridMenuClose();
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        top: 0
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        {/* Left side - Empty space */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        </Box>

        {/* Right side - Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPurchase}
            sx={{
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#0056b3',
              },
              boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
            }}
          >
            Add Purchase
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSale}
            sx={{
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#c82333',
              },
              boxShadow: '0 2px 4px rgba(220,53,69,0.3)',
            }}
          >
            Add Sale
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleInvoice}
            sx={{
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#218838',
              },
              boxShadow: '0 2px 4px rgba(40,167,69,0.3)',
            }}
          >
            Invoice
          </Button>

          <Button
            variant="contained"
            onClick={handleDarkModeToggle}
            sx={{
              backgroundColor: darkMode ? '#333' : '#f0f0f0',
              color: darkMode ? 'white' : '#333',
              borderRadius: '8px',
              minWidth: '40px',
              width: '40px',
              height: '40px',
              padding: 0,
              '&:hover': {
                backgroundColor: darkMode ? '#555' : '#e0e0e0',
              },
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </Button>

         

          {/* User Menu Button */}
          <Button
            onClick={handleUserMenuClick}
            sx={{
              backgroundColor: darkMode ? '#333' : '#f0f0f0',
              color: darkMode ? 'white' : '#333',
              borderRadius: '8px',
              minWidth: '40px',
              padding: '8px',
              '&:hover': {
                backgroundColor: darkMode ? '#555' : '#e0e0e0',
              },
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <PersonIcon />
            {user && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', ml: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {user.firstName} {user.lastName}
                </Typography>
              </Box>
            )}
          </Button>

          {/* User Menu */}
          <Menu
            anchorEl={userMenuAnchorEl}
            open={isUserMenuOpen}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {user?.email}
              </Typography>
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                mx: 1,
                mb: 1,
                bgcolor: darkMode ? '#333' : '#f5f5f5',
                borderRadius: 1,
              }}
            >
              <Button
                fullWidth
                onClick={() => {
                  handleUserMenuClose();
                  navigate('/users/profile');
                }}
                sx={{
                  justifyContent: 'flex-start',
                  color: 'inherit',
                  textTransform: 'none',
                }}
              >
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                Profile
              </Button>
            </Paper>
            <Box sx={{ px: 1, pb: 1 }}>
              <Button
                fullWidth
                onClick={handleLogout}
                sx={{
                  color: 'error.main',
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                }}
              >
                Logout
              </Button>
            </Box>
          </Menu>

          {/* Grid Menu */}
          <Menu
            anchorEl={gridMenuAnchorEl}
            open={isGridMenuOpen}
            onClose={handleGridMenuClose}
            onClick={handleGridMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                width: 320,
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ width: '100%' }}>
              <Grid container spacing={1}>
                {/* Row 1 */}
                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/sales/billing')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <ReceiptIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Sale Invoice</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/purchase/payments')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <ShoppingCartIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Purchase Bill</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/expenses')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <PaymentIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Expense</Typography>
                  </Paper>
                </Grid>

                {/* Row 2 */}
                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/sales/payment-in')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <ArrowDownwardIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Payment In</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/purchase/payment-out')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <ArrowUpwardIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Payment Out</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/purchase/order')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <AssignmentIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Purchase Order</Typography>
                  </Paper>
                </Grid>

                {/* Row 3 */}
                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/sales/sales-return')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <ArrowUpwardIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Sale Return/Cr.Note</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/purchase/return')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <ArrowDownwardIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Purchase Return/Dr.Note</Typography>
                  </Paper>
                </Grid>

                {/* Row 4 */}
                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/products')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <InventoryIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Create Item</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/customers')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <PersonIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Create Customer</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper
                    onClick={() => handleMenuItemClick('/suppliers')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <BusinessIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Create Supplier</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
