import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import ChangePassword from './ChangePassword';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

function Profile() {
  const [selectedOption, setSelectedOption] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: null,
    status: '',
    createdAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setFetchingProfile(true);
      const response = await api.get('/users/profile');
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile data');
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/users/profile', formData);
      setFormData(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form data to last fetched data
    fetchUserProfile();
  };

  const renderContent = () => {
    if (selectedOption === 'password') {
      return <ChangePassword />;
    }

    if (fetchingProfile) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Paper sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9f43' }}>
            Profile
          </Typography>
          <Box>
            {formData.role && (
              <Chip 
                label={formData.role.name || 'No Role'} 
                color="primary" 
                size="small" 
                sx={{ mr: 1 }}
              />
            )}
            <Chip 
              label={formData.status} 
              color={formData.status === 'Active' ? 'success' : 'default'} 
              size="small" 
            />
          </Box>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                First Name
              </Typography>
              <TextField
                fullWidth
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Last Name
              </Typography>
              <TextField
                fullWidth
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Mobile
              </Typography>
              <TextField
                fullWidth
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            {formData.createdAt && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account created on {format(new Date(formData.createdAt), 'PPP')}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    backgroundColor: '#ff9f43',
                    '&:hover': {
                      backgroundColor: '#e8890a',
                    },
                  }}
                >
                  {loading ? 'Saving...' : 'Submit'}
                </Button>
                <Button
                  variant="text"
                  onClick={handleClose}
                  sx={{ color: '#ff9f43' }}
                >
                  Close
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
      {/* Left Side - Options Menu */}
      <Paper sx={{ width: 250, height: 'fit-content' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #eee', color: '#ff9f43' }}>
          Options
        </Typography>
        <List>
          <ListItemButton
            selected={selectedOption === 'profile'}
            onClick={() => setSelectedOption('profile')}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#ff9f43',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#e8890a',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
          <ListItemButton
            selected={selectedOption === 'password'}
            onClick={() => setSelectedOption('password')}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#ff9f43',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#e8890a',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon>
              <LockIcon />
            </ListItemIcon>
            <ListItemText primary="Change Password" />
          </ListItemButton>
        </List>
      </Paper>
      {/* Right Side - Content */}
      {renderContent()}
    </Box>
  );
}

export default Profile; 