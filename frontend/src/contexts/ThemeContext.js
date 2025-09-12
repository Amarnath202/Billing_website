import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Get initial theme from localStorage or default to false
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Create Material-UI theme based on dark mode state
  const theme = createTheme({
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      h1: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
      },
      h2: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
      },
      h3: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 500,
      },
      h6: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 500,
      },
      body1: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 400,
      },
      body2: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 400,
      },
      button: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 500,
        textTransform: 'none',
      },
      caption: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 400,
      },
      overline: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: 400,
      },
    },
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f8f9fa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? '#b0b0b0' : '#666666',
      },
      divider: darkMode ? '#333333' : '#e0e0e0',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: darkMode ? '#121212' : '#f8f9fa',
            transition: 'background-color 0.3s ease',
          },
          '#root': {
            minHeight: '100vh',
            backgroundColor: darkMode ? '#121212' : '#f8f9fa',
          },
        },
      },
      MuiBox: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? 'transparent' : '#f8f9fa',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            borderBottom: `1px solid ${darkMode ? '#333333' : '#e0e0e0'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            borderRight: `1px solid ${darkMode ? '#333333' : '#e0e0e0'}`,
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: darkMode ? '#333333' : '#f5f5f5',
            },
            '&.Mui-selected': {
              backgroundColor: darkMode ? '#333333' : '#e3f2fd',
              '&:hover': {
                backgroundColor: darkMode ? '#404040' : '#bbdefb',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            borderRadius: '8px',
            boxShadow: darkMode
              ? '0 4px 6px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", sans-serif',
            '& .MuiOutlinedInput-root': {
              backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
              color: darkMode ? '#ffffff' : '#000000',
              fontFamily: '"Inter", sans-serif',
              '& fieldset': {
                borderColor: darkMode ? '#404040' : '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: darkMode ? '#555555' : '#b0b0b0',
              },
              '&.Mui-focused fieldset': {
                borderColor: darkMode ? '#90caf9' : '#1976d2',
              },
            },
            '& .MuiInputLabel-root': {
              color: darkMode ? '#b0b0b0' : '#666666',
              fontFamily: '"Inter", sans-serif',
              '&.Mui-focused': {
                color: darkMode ? '#90caf9' : '#1976d2',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: darkMode ? '#353535' : '#f5f5f5',
            },
            '&.Mui-selected': {
              backgroundColor: darkMode ? '#404040' : '#e3f2fd',
              '&:hover': {
                backgroundColor: darkMode ? '#4a4a4a' : '#bbdefb',
              },
            },
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            borderRadius: '8px',
            boxShadow: darkMode
              ? '0 4px 6px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
            color: darkMode ? '#ffffff' : '#000000',
            backgroundColor: 'transparent',
            padding: '12px 16px',
            fontFamily: '"Inter", sans-serif',
          },
          head: {
            backgroundColor: darkMode ? '#333333' : '#ffffff',
            color: darkMode ? '#ff9f43' : '#ff9f43',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: `2px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
            fontFamily: '"Inter", sans-serif',
          },
          body: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            fontFamily: '"Inter", sans-serif',
            '&:hover': {
              backgroundColor: darkMode ? '#353535' : '#f8f9fa',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            '&:hover': {
              backgroundColor: darkMode ? '#353535' : '#f8f9fa',
            },
            '&:nth-of-type(even)': {
              backgroundColor: darkMode ? '#2e2e2e' : '#fafafa',
              '&:hover': {
                backgroundColor: darkMode ? '#353535' : '#f0f0f0',
              },
            },
            '&.MuiTableRow-head': {
              backgroundColor: darkMode ? '#333333' : '#ffffff',
              '&:hover': {
                backgroundColor: darkMode ? '#333333' : '#ffffff',
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#333333' : '#ffffff',
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            textTransform: 'none',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", sans-serif',
          },
        },
      },
    },
  });

  const value = {
    darkMode,
    toggleDarkMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
