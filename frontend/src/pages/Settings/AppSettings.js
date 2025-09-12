import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Folder as GeneralIcon,
  Image as AppLogoIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const AppSettings = () => {
  const { darkMode } = useTheme();
  const { settings, updateSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState('General');
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [setFaviconFile] = useState(null);
  const [setColoredLogoFile] = useState(null);

  // Sync formData with settings when settings change
  useEffect(() => {
    console.log('AppSettings - Settings changed, updating formData:', settings);
    setFormData(settings);
  }, [settings]);

  const settingsTabs = [
    { name: 'General', icon: <GeneralIcon />, active: true },
    { name: 'App Logo', icon: <AppLogoIcon />, active: false },
    { name: 'Email Settings', icon: <EmailIcon />, active: false },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Form data being submitted:', formData);
      console.log('Current settings before update:', settings);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the settings in context (this will also update localStorage)
      updateSettings(formData);

      // Verify the update worked
      setTimeout(() => {
        const savedSettings = localStorage.getItem('appSettings');
        console.log('Settings after update - localStorage:', savedSettings);
      }, 100);

      console.log('Settings updated successfully');

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form to current saved settings
    setFormData(settings);
    setFaviconFile(null);
    setColoredLogoFile(null);
    setError('');
    setSuccess('');
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        if (type === 'favicon') {
          setFaviconFile(file);
          updateSettings({ ...settings, favicon: imageUrl });
        } else if (type === 'coloredLogo') {
          setColoredLogoFile(file);
          updateSettings({ ...settings, coloredLogo: imageUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = (type) => {
    if (type === 'favicon') {
      setFaviconFile(null);
      updateSettings({ ...settings, favicon: null });
    } else if (type === 'coloredLogo') {
      setColoredLogoFile(null);
      updateSettings({ ...settings, coloredLogo: null });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          color: '#ff9f43', 
          fontWeight: 600,
          fontSize: '28px'
        }}
      >
        Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Settings Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
              color: darkMode ? '#ffffff' : '#000000'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                p: 2, 
                color: '#ff9f43', 
                fontWeight: 600,
                fontSize: '18px',
                borderBottom: `1px solid ${darkMode ? '#404040' : '#e0e0e0'}`
              }}
            >
              Settings
            </Typography>
            <List>
              {settingsTabs.map((tab) => (
                <ListItem key={tab.name} disablePadding>
                  <ListItemButton
                    selected={activeTab === tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    sx={{
                      backgroundColor: activeTab === tab.name ? '#2196f3' : 'transparent',
                      color: activeTab === tab.name ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: activeTab === tab.name ? '#1976d2' : (darkMode ? '#404040' : '#f5f5f5'),
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#ff9f43',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#e8890a',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: activeTab === tab.name ? '#ffffff' : 'inherit' }}>
                      {tab.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={tab.name}
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '14px',
                          fontWeight: activeTab === tab.name ? 600 : 400,
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Settings Content */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={2} 
            sx={{ 
              padding: '24px',
              backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
              color: darkMode ? '#ffffff' : '#000000'
            }}
          >
            {activeTab === 'General' && (
              <>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    color: '#ff9f43', 
                    fontWeight: 600,
                    fontSize: '20px'
                  }}
                >
                  General
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Application Name
                      </Typography>
                      <TextField
                        fullWidth
                        name="applicationName"
                        value={formData.applicationName}
                        onChange={handleInputChange}
                        required
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Footer Text
                      </Typography>
                      <TextField
                        fullWidth
                        name="footerText"
                        value={formData.footerText}
                        onChange={handleInputChange}
                        required
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </Grid>

                    

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Timezone
                      </Typography>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <Select
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="(GMT/UTC 05:30)Kolkata">(GMT/UTC 05:30)Kolkata</MenuItem>
                          <MenuItem value="(GMT/UTC 00:00)London">(GMT/UTC 00:00)London</MenuItem>
                          <MenuItem value="(GMT/UTC -05:00)New York">(GMT/UTC -05:00)New York</MenuItem>
                          <MenuItem value="(GMT/UTC +09:00)Tokyo">(GMT/UTC +09:00)Tokyo</MenuItem>
                          <MenuItem value="(GMT/UTC +08:00)Singapore">(GMT/UTC +08:00)Singapore</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Date Format
                      </Typography>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <Select
                          name="dateFormat"
                          value={formData.dateFormat}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="Y-m-d">Y-m-d</MenuItem>
                          <MenuItem value="d-m-Y">d-m-Y</MenuItem>
                          <MenuItem value="m/d/Y">m/d/Y</MenuItem>
                          <MenuItem value="d/m/Y">d/m/Y</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Time Format
                      </Typography>
                      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                        <Select
                          name="timeFormat"
                          value={formData.timeFormat}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="24 Hours">24 Hours</MenuItem>
                          <MenuItem value="12 Hours">12 Hours</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        backgroundColor: '#ff9f43',
                        '&:hover': {
                          backgroundColor: '#e8890a',
                        },
                        '&:disabled': {
                          backgroundColor: '#bbdefb',
                        },
                      }}
                    >
                      {loading ? 'Saving...' : 'Submit'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleClose}
                      variant="outlined"
                      sx={{
                        borderColor: '#666',
                        color: '#666',
                        '&:hover': {
                          borderColor: '#333',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                </form>
              </>
            )}

            {activeTab === 'App Logo' && (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    color: '#ff9f43',
                    fontWeight: 600,
                    fontSize: '20px'
                  }}
                >
                  App Logo
                </Typography>

                <Grid container spacing={4}>
                  {/* Favicon Section */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      Favicon
                    </Typography>

                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9'
                    }}>
                      {/* Logo Display */}
                      <Box sx={{
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ff9f43',
                        borderRadius: 1,
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}>
                        {settings.favicon ? (
                          <img
                            src={settings.favicon}
                            alt="Favicon"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          'N'
                        )}
                      </Box>

                      {/* Upload Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          component="label"
                          sx={{
                            borderColor: '#2196f3',
                            color: '#2196f3',
                            '&:hover': {
                              borderColor: '#1976d2',
                              backgroundColor: 'rgba(33, 150, 243, 0.04)',
                            },
                          }}
                        >
                          Browse
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'favicon')}
                          />
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleResetLogo('favicon')}
                          sx={{
                            borderColor: '#666',
                            color: '#666',
                            '&:hover': {
                              borderColor: '#333',
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Box>

                    <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                      Allowed: JPG, GIF or PNG. Max size of 1MB
                    </Typography>
                  </Grid>

                  {/* Colored Logo Section */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      Colored Logo
                    </Typography>

                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9'
                    }}>
                      {/* Logo Display */}
                      <Box sx={{
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ff9f43',
                        borderRadius: 1,
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}>
                        {settings.coloredLogo ? (
                          <img
                            src={settings.coloredLogo}
                            alt="Colored Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          'N'
                        )}
                      </Box>

                      {/* Upload Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          component="label"
                          sx={{
                            borderColor: '#2196f3',
                            color: '#2196f3',
                            '&:hover': {
                              borderColor: '#1976d2',
                              backgroundColor: 'rgba(33, 150, 243, 0.04)',
                            },
                          }}
                        >
                          Browse
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'coloredLogo')}
                          />
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleResetLogo('coloredLogo')}
                          sx={{
                            borderColor: '#666',
                            color: '#666',
                            '&:hover': {
                              borderColor: '#333',
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Box>

                    <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                      Allowed: JPG, GIF or PNG. Max size of 1MB
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', mt: 4 }}>
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                      backgroundColor: '#ff9f43',
                      '&:hover': {
                        backgroundColor: '#e8890a',
                      },
                      '&:disabled': {
                        backgroundColor: '#bbdefb',
                      },
                    }}
                  >
                    {loading ? 'Saving...' : 'Submit'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleClose}
                    sx={{
                      borderColor: '#666',
                      color: '#666',
                      '&:hover': {
                        borderColor: '#333',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </>
            )}

            {activeTab === 'Email Settings' && (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    color: '#ff9f43',
                    fontWeight: 600,
                    fontSize: '20px'
                  }}
                >
                  SMTP Settings
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                  {/* Host */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Host
                    </Typography>
                    <TextField
                      fullWidth
                      name="smtpHost"
                      value={formData.smtpHost || ''}
                      onChange={handleInputChange}
                      placeholder="Enter SMTP host"
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                        }
                      }}
                    />
                  </Grid>

                  {/* Port */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Port
                    </Typography>
                    <TextField
                      fullWidth
                      name="smtpPort"
                      value={formData.smtpPort || ''}
                      onChange={handleInputChange}
                      placeholder="Enter SMTP port"
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                        }
                      }}
                    />
                  </Grid>

                  {/* Username */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Username
                    </Typography>
                    <TextField
                      fullWidth
                      name="smtpUsername"
                      value={formData.smtpUsername || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your SMTP username/email"
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                        }
                      }}
                    />
                  </Grid>

                  {/* Password */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Password
                    </Typography>
                    <TextField
                      fullWidth
                      name="smtpPassword"
                      type="password"
                      value={formData.smtpPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your SMTP password"
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                        }
                      }}
                    />
                  </Grid>

                  {/* Encryption */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Encryption
                    </Typography>
                    <TextField
                      fullWidth
                      name="smtpEncryption"
                      select
                      value={formData.smtpEncryption || 'tls'}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                        }
                      }}
                    >
                      <MenuItem value="tls">TLS</MenuItem>
                      <MenuItem value="ssl">SSL</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Status */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Status
                    </Typography>
                    <TextField
                      fullWidth
                      name="smtpStatus"
                      select
                      value={formData.smtpStatus || 'Enable'}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                        }
                      }}
                    >
                      <MenuItem value="Enable">Enable</MenuItem>
                      <MenuItem value="Disable">Disable</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', mt: 4 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        backgroundColor: '#ff9f43',
                        '&:hover': {
                          backgroundColor: '#e8890a',
                        },
                        '&:disabled': {
                          backgroundColor: '#bbdefb',
                        },
                      }}
                    >
                      {loading ? 'Saving...' : 'Submit'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleClose}
                      sx={{
                        borderColor: '#666',
                        color: '#666',
                        '&:hover': {
                          borderColor: '#333',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                </form>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AppSettings;
