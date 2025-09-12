import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './AppRoutes';
import { Box } from '@mui/material';

function App() {
  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AppSettingsProvider>
          <Router>
            <AuthProvider>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100vh',
                  width: '100%',
                }}
              >
                <AppRoutes />
                <Toaster position="top-right" />
              </Box>
            </AuthProvider>
          </Router>
        </AppSettingsProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
