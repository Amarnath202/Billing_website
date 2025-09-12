import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { useAppSettings } from '../contexts/AppSettingsContext';

function Footer() {
  const { settings } = useAppSettings();
  const [footerText, setFooterText] = useState(settings.footerText);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Update footer text when settings change
  useEffect(() => {
    setFooterText(settings.footerText);
    setForceUpdate(prev => prev + 1); // Force re-render
  }, [settings.footerText]);

  // Also listen for localStorage changes (in case of direct updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.footerText !== footerText) {
            setFooterText(parsedSettings.footerText);
            setForceUpdate(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error parsing settings from localStorage:', error);
        }
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [footerText]);

  // Debug: Log when footer text changes
  useEffect(() => {
    console.log('Footer text updated:', footerText, 'Force update:', forceUpdate);
  }, [footerText, forceUpdate]);

  return (
    <Box
      component="footer"
      key={`footer-${forceUpdate}`} // Force re-render with key
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        left: '240px', // Account for sidebar width
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 1,
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        zIndex: 1100,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ fontSize: '0.875rem' }}
      >
        {footerText}
      </Typography>
    </Box>
  );
}

export default Footer;
