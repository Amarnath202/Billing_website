import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  ShoppingCart as ShoppingCartIcon,
  ExpandLess,
  ExpandMore,
  LocalShipping as LocalShippingIcon,
  AssignmentReturn as AssignmentReturnIcon,
  AccountBalanceWallet as CashIcon,
  PointOfSale as SalesIcon,
  Contacts as ContactsIcon,
  Person as CustomerIcon,
  Business as SupplierIcon,
  Warehouse as WarehouseIcon,
  Email as EmailIcon,
  Receipt as ExpenseIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Apps as AppsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  QrCode as QrCodeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

// CORE section menu items
const coreMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', module: 'Dashboard' },
  {
    text: 'Contacts',
    icon: <ContactsIcon />,
    submenu: [
      { text: 'Customers', icon: <CustomerIcon />, path: '/customers', module: 'Customers' },
      { text: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers', module: 'Suppliers' },
    ],
  },
  {
    text: 'Sales',
    icon: <SalesIcon />,
    submenu: [
      { text: 'Invoice', icon: <ReceiptIcon />, path: '/billing', module: 'Sales Invoice' },
      { text: 'Barcode', icon: <QrCodeIcon />, path: '/barcode', module: 'Barcode' },
      { text: 'Sales History', icon: <HistoryIcon />, path: '/sales-history', module: 'Sales History' },
      { text: 'Payment In', icon: <PaymentIcon />, path: '/payment-in', module: 'Payment In' },
      { text: 'Sales Order', icon: <LocalShippingIcon />, path: '/sales-order', module: 'Sales Order' },
      { text: 'Cash & Bank', icon: <CashIcon />, path: '/payment', module: 'Sales Cash & Bank' },
      { text: 'Sales Return', icon: <AssignmentReturnIcon />, path: '/sales-return', module: 'Sales Return' }
    ],
  },
  {
    text: 'Purchase',
    icon: <ShoppingCartIcon />,
    submenu: [
      { text: 'Payment Out', icon: <PaymentIcon />, path: '/payment-out', module: 'Payment Out' },
      { text: 'Purchase Order', icon: <LocalShippingIcon />, path: '/purchase-order', module: 'Purchase' },
      { text: 'Cash&Bank', icon: <CashIcon />, path: '/payments', module: 'Purchase Cash & Bank' },
      { text: 'Purchase Return/Dr.Note', icon: <AssignmentReturnIcon />, path: '/purchase-return', module: 'Purchase Return' }
    ],
  },
  {
    text: 'Items',
    icon: <InventoryIcon />,
    submenu: [
      { text: 'Products', icon: <InventoryIcon />, path: '/products', module: 'Products' },
      { text: 'Brands', icon: <InventoryIcon />, path: '/brands', module: 'Brands' },
      { text: 'Categories', icon: <InventoryIcon />, path: '/categories', module: 'Categories' },
    ],
  }
];

// OTHERS section menu items
const othersMenuItems = [
  {
    text: 'Warehouses',
    icon: <WarehouseIcon />,
    submenu: [
      { text: 'Warehouses', icon: <WarehouseIcon />, path: '/warehouses', module: 'Warehouses' },
    ],
  },
  {
    text: 'Expense',
    icon: <ExpenseIcon />,
    submenu: [
      { text: 'Expense List', icon: <ExpenseIcon />, path: '/expenses', module: 'Expenses List' },
    ],
  },
  {
    text: 'Reports',
    icon: <ReportsIcon />,
    submenu: [
      { text: 'Profit and Loss', icon: <ReportsIcon />, path: '/reports/profit-loss', module: 'Profit and Loss' },
      { text: 'Purchase Report', icon: <ShoppingCartIcon />, path: '/reports/purchase', module: 'Purchase Report' },
      { text: 'Sales Report', icon: <SalesIcon />, path: '/reports/sales', module: 'Sales Report' },
      { text: 'Product Report', icon: <InventoryIcon />, path: '/reports/product', module: 'Product Report' },
      { text: 'Expense Report', icon: <ExpenseIcon />, path: '/reports/expense', module: 'Expense Report' },
    ],
  },
  {
    text: 'Email',
    icon: <EmailIcon />,
    submenu: [
      { text: 'Send Email', icon: <EmailIcon />, path: '/email', module: 'Send Email' },
      { text: 'Email History', icon: <HistoryIcon />, path: '/email-history', module: 'Email History' }
    ]
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    submenu: [
      { text: 'App Settings', icon: <AppsIcon />, path: '/settings', module: 'App Settings' }
    ]
  },
  {
    text: 'Users',
    icon: <PersonIcon />,
    submenu: [
      { text: 'Profile', icon: <PersonIcon />, path: '/users/profile', module: 'Profile' },
      { text: 'Users', icon: <PersonIcon />, path: '/users/list', module: 'Users' },
      { text: 'Roles', icon: <PersonIcon />, path: '/users/roles', module: 'Roles' }
    ]
  },
  {
    text: 'Other Settings',
    icon: <SettingsIcon />,
    submenu: [
      { text: 'Tax Rates', icon: <ReceiptIcon />, path: '/tax-rates', module: 'Tax' },
      { text: 'Discount', icon: <PaymentIcon />, path: '/discount', module: 'Discount' }
    ]
  }
];

// Get all available modules from menu items
const getAllModules = (menuItems) => {
  return menuItems.reduce((modules, item) => {
    if (item.submenu) {
      return [...modules, ...item.submenu.map(subItem => subItem.module).filter(Boolean)];
    }
    if (item.module) {
      return [...modules, item.module];
    }
    return modules;
  }, []);
};

const AVAILABLE_MODULES = [...getAllModules(coreMenuItems), ...getAllModules(othersMenuItems)];

function Sidebar() {
  const location = useLocation();
  const { settings, sidebarCollapsed, toggleSidebar } = useAppSettings();
  const { hasPermission } = useAuth();
  const [openMenus, setOpenMenus] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [visibleModules, setVisibleModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    loadUserPermissions();
  }, []);

  // Listen for storage changes (when user logs in/out)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, reloading permissions...');
      loadUserPermissions();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events
    window.addEventListener('userDataChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataChanged', handleStorageChange);
    };
  }, []);

  const loadUserPermissions = () => {
    try {
      setIsLoading(true);

      // Get user data from localStorage (set during login/signup)
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data from localStorage:', userData);

      if (userData && userData.role) {
        setUserRole(userData.role);

        // Set visible modules based on role permissions
        if (userData.role.permissions && userData.role.permissions.length > 0) {
          const visibleModuleNames = userData.role.permissions
            .filter(permission => permission.visible)
            .map(permission => permission.module);
          console.log('Visible modules from permissions:', visibleModuleNames);
          console.log('Available modules in sidebar:', AVAILABLE_MODULES);

          // For Admin, if they have extensive permissions, show all modules
          if (userData.role.name === 'Admin' && visibleModuleNames.length > 10) {
            console.log('Admin user with extensive permissions - showing all modules');
            setVisibleModules(AVAILABLE_MODULES);
          } else {
            setVisibleModules(visibleModuleNames);
          }
        } else {
          // If no specific permissions, show all modules for admin or basic modules for user
          if (userData.role.name === 'Admin') {
            console.log('Admin user - showing all modules');
            setVisibleModules(AVAILABLE_MODULES);
          } else {
            // For regular users, show basic modules
            const basicModules = ['Dashboard', 'Products', 'Sales Invoice', 'Customers'];
            console.log('User role - showing basic modules:', basicModules);
            setVisibleModules(basicModules);
          }
        }
      } else {
        console.log('No user data found - showing all modules as fallback');
        // Fallback to showing all modules if no user data is found
        setVisibleModules(AVAILABLE_MODULES);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      // In case of error, show all modules as a fallback
      console.log('Error occurred - showing all modules as fallback');
      setVisibleModules(AVAILABLE_MODULES);
      setIsLoading(false);
    }
  };

  const handleMenuClick = (text) => {
    setOpenMenus(prev => {
      if (prev[text]) {
        return {};
      }
      return { [text]: true };
    });
  };

  const isMenuOpen = (text) => {
    return !!openMenus[text];
  };

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  // Local permission check function
  const checkModulePermission = (moduleName) => {
    if (!moduleName) return true;

    // If we're still loading, don't show anything
    if (isLoading) return false;

    // Dashboard should always be visible
    if (moduleName === 'Dashboard') return true;

    // For Admin users, always show all modules
    if (userRole?.name === 'Admin') {
      return true;
    }

    // Check if module is in visible modules list (exact match)
    let isVisible = visibleModules.includes(moduleName);

    // If not found, try partial matching for common variations
    if (!isVisible) {
      isVisible = visibleModules.some(visibleModule => {
        // Check if the visible module contains the required module name or vice versa
        return visibleModule.toLowerCase().includes(moduleName.toLowerCase()) ||
               moduleName.toLowerCase().includes(visibleModule.toLowerCase());
      });
    }

    console.log(`Checking permission for module "${moduleName}":`, isVisible, 'Available modules:', visibleModules.length);
    return isVisible;
  };

  // Check if a submenu has any visible items
  const hasVisibleSubmenuItems = (submenu) => {
    return submenu.some(item => {
      // If the item has a module, check if it's visible according to permissions
      if (item.module) {
        return checkModulePermission(item.module);
      }
      // If no module is specified, show the item
      return true;
    });
  };

  // Filter submenu items based on visibility
  const getVisibleSubmenuItems = (submenu) => {
    return submenu.filter(item => {
      // If the item has a module, check if it's visible according to permissions
      if (item.module) {
        return checkModulePermission(item.module);
      }
      // If no module is specified, show the item
      return true;
    });
  };

  // Helper function to render menu items
  const renderMenuItems = (menuItems) => {
    return menuItems.map((item) => {
      if (item.submenu) {
        // Skip menu items with no visible submenu items
        const visibleSubItems = getVisibleSubmenuItems(item.submenu);
        if (visibleSubItems.length === 0) {
          return null;
        }

        return (
          <React.Fragment key={item.text}>
            <Tooltip title={sidebarCollapsed ? item.text : ""} placement="right" disableHoverListener={!sidebarCollapsed}>
              <ListItem
                component="button"
                onClick={() => sidebarCollapsed ? null : handleMenuClick(item.text)}
                sx={{
                  backgroundColor: isSubmenuActive(visibleSubItems) ? '#fff3e0' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#fff3e0',
                  },
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  px: sidebarCollapsed ? 1 : 2,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon sx={{
                  color: isSubmenuActive(visibleSubItems) ? '#ff9f43' : theme.palette.text.primary,
                  minWidth: sidebarCollapsed ? 'auto' : '56px',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        color: isSubmenuActive(visibleSubItems) ? '#ff9f43' : theme.palette.text.primary,
                        '& .MuiTypography-root': {
                          fontWeight: isSubmenuActive(visibleSubItems) ? 600 : 400,
                          fontSize: '15px',
                        }
                      }}
                    />
                    {isMenuOpen(item.text) ? <ExpandLess sx={{ color: isSubmenuActive(visibleSubItems) ? '#ff9f43' : theme.palette.text.primary }} /> : <ExpandMore sx={{ color: isSubmenuActive(visibleSubItems) ? '#ff9f43' : theme.palette.text.primary }} />}
                  </>
                )}
              </ListItem>
            </Tooltip>
            {!sidebarCollapsed && (
              <Collapse in={isMenuOpen(item.text)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {visibleSubItems.map((subItem) => (
                    <ListItem
                      component={Link}
                      to={subItem.path}
                      key={subItem.text}
                      sx={{
                        pl: 4,
                        backgroundColor: isPathActive(subItem.path) ? '#fff3e0' : 'transparent',
                        '&:hover': {
                          backgroundColor: '#fff3e0',
                        },
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      <ListItemIcon sx={{ color: isPathActive(subItem.path) ? '#ff9f43' : theme.palette.text.primary }}>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={subItem.text}
                        sx={{
                          color: isPathActive(subItem.path) ? '#ff9f43' : theme.palette.text.primary,
                          '& .MuiTypography-root': {
                            fontWeight: isPathActive(subItem.path) ? 600 : 400,
                            fontSize: '15px',
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        );
      }

      // For single menu items (no submenu)
      if (item.module && !checkModulePermission(item.module)) {
        return null;
      }

      return (
        <Tooltip key={item.text} title={sidebarCollapsed ? item.text : ""} placement="right" disableHoverListener={!sidebarCollapsed}>
          <ListItem
            component={Link}
            to={item.path}
            sx={{
              backgroundColor: isPathActive(item.path) ? '#fff3e0' : 'transparent',
              '&:hover': {
                backgroundColor: '#fff3e0',
              },
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              px: sidebarCollapsed ? 1 : 2,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <ListItemIcon sx={{
              color: isPathActive(item.path) ? '#ff9f43' : theme.palette.text.primary,
              minWidth: sidebarCollapsed ? 'auto' : '56px',
              justifyContent: 'center'
            }}>
              {item.icon}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText
                primary={item.text}
                sx={{
                  color: isPathActive(item.path) ? '#ff9f43' : theme.palette.text.primary,
                  '& .MuiTypography-root': {
                    fontWeight: isPathActive(item.path) ? 600 : 400,
                    fontSize: '15px',
                  }
                }}
              />
            )}
          </ListItem>
        </Tooltip>
      );
    }).filter(Boolean); // Remove null items
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
          boxSizing: 'border-box',
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Fixed Header with App Logo and Name - Matches main header height */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          height: '64px', // Standard AppBar height
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          gap: sidebarCollapsed ? 0 : 1.5,
          px: sidebarCollapsed ? 1 : 2,
        }}
      >
        {!sidebarCollapsed && (
          <>
            {/* App Logo */}
            <Box sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ff9f43',
              borderRadius: 1,
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {settings.coloredLogo ? (
                <img
                  src={settings.coloredLogo}
                  alt="App Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              ) : (
                'N'
              )}
            </Box>

            {/* App Name */}
            <Typography
              variant="h6"
              sx={{
                color: '#ff9f43',
                fontWeight: 600,
                fontSize: '16px',
              }}
            >
              {settings.applicationName}
            </Typography>
          </>
        )}

        {sidebarCollapsed && (
          /* Collapsed Logo */
          <Box sx={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ff9f43',
            borderRadius: 1,
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {settings.coloredLogo ? (
              <img
                src={settings.coloredLogo}
                alt="App Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            ) : (
              'N'
            )}
          </Box>
        )}

        {/* Toggle Button */}
        <Tooltip title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
          <IconButton
            onClick={toggleSidebar}
            sx={{
              color: '#ff9f43',
              '&:hover': {
                backgroundColor: 'rgba(255, 159, 67, 0.1)',
              },
              ...(sidebarCollapsed && {
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
              }),
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Scrollable Menu Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading menu...
            </Typography>
          </Box>
        ) : (
          <>

            {/* CORE Section */}
            <List sx={{ pt: 1 }}>
              {!sidebarCollapsed && (
                <ListSubheader
                  sx={{
                    backgroundColor: 'transparent',
                    color: '#888',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    px: 2,
                    py: 1,
                    lineHeight: '20px',
                  }}
                >
                  CORE
                </ListSubheader>
              )}
              {renderMenuItems(coreMenuItems)}
            </List>

            {/* OTHERS Section */}
            <List sx={{ pt: 0 }}>
              {!sidebarCollapsed && (
                <ListSubheader
                  sx={{
                    backgroundColor: 'transparent',
                    color: '#888',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    px: 2,
                    py: 1,
                    lineHeight: '20px',
                    mt: 1,
                  }}
                >
                  OTHERS
                </ListSubheader>
              )}
              {renderMenuItems(othersMenuItems)}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
}

export default Sidebar; 