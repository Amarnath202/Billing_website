import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { emailAPI } from '../../services/api';

function Email() {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    attachment: null,
  });
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [customersRes, suppliersRes] = await Promise.all([
          emailAPI.getCustomers(),
          emailAPI.getSuppliers()
        ]);
        setCustomers(customersRes.data);
        setSuppliers(suppliersRes.data);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to load contacts');
      }
    };
    fetchContacts();
  }, []);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setSelectedContacts([]);
    setEmailData(prev => ({ ...prev, to: '' }));
    setRecipients([]);
  };

  const handleContactChange = (event) => {
    const value = event.target.value;
    setSelectedContacts(value);
    
    const contacts = selectedType === 'customer' ? customers : suppliers;
    const selectedEmails = value.map(id => {
      const contact = contacts.find(c => c._id === id);
      return contact ? contact.email : null;
    }).filter(Boolean);
    
    setEmailData(prev => ({ ...prev, to: selectedEmails.join(', ') }));
    setRecipients(selectedEmails);
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = emailData.to.trim();
      
      if (email && validateEmail(email) && !recipients.includes(email)) {
        setRecipients([...recipients, email]);
        setEmailData({ ...emailData, to: '' });
      } else if (email && !validateEmail(email)) {
        toast.error('Please enter a valid email address');
      }
    }
  };

  const handleRemoveRecipient = (emailToRemove) => {
    const newRecipients = recipients.filter(email => email !== emailToRemove);
    setRecipients(newRecipients);
    
    // Update selected contacts to match remaining recipients
    const contacts = selectedType === 'customer' ? customers : suppliers;
    const remainingContacts = selectedContacts.filter(id => {
      const contact = contacts.find(c => c._id === id);
      return contact && newRecipients.includes(contact.email);
    });
    setSelectedContacts(remainingContacts);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should not exceed 5MB');
        return;
      }
      setEmailData((prev) => ({
        ...prev,
        attachment: file,
      }));
    }
  };

  const handleRemoveAttachment = () => {
    setEmailData((prev) => ({
      ...prev,
      attachment: null,
    }));
  };

  const handlePreview = () => {
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    if (!emailData.subject || !emailData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('to', recipients.join(','));
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.message);
      if (emailData.attachment) {
        formData.append('attachment', emailData.attachment);
      }

      const response = await emailAPI.sendEmail(formData);
      console.log('Email sent successfully:', response);

      toast.success('Email sent successfully');
      setEmailData({
        to: '',
        subject: '',
        message: '',
        attachment: null,
      });
      setRecipients([]);
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'Failed to send email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
          Send Email
        </Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Type</InputLabel>
              <Select
                value={selectedType}
                onChange={handleTypeChange}
                label="Select Type"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
              </Select>
            </FormControl>

            {selectedType && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{selectedType === 'customer' ? 'Select Customers' : 'Select Suppliers'}</InputLabel>
                <Select
                  multiple
                  value={selectedContacts}
                  onChange={handleContactChange}
                  input={<OutlinedInput label={selectedType === 'customer' ? 'Select Customers' : 'Select Suppliers'} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const contact = (selectedType === 'customer' ? customers : suppliers).find(c => c._id === value);
                        return contact ? (
                          <Chip 
                            key={value} 
                            label={contact.name}
                            sx={{
                              backgroundColor: '#ff9f43',
                              color: 'white',
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {(selectedType === 'customer' ? customers : suppliers).map((contact) => (
                    <MenuItem key={contact._id} value={contact._id}>
                      {contact.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="To"
              name="to"
              value={emailData.to}
              onChange={handleInputChange}
              onKeyPress={handleEmailKeyPress}
              placeholder="Type email and press Enter or comma to add"
              sx={{ mb: 1 }}
            />
            {recipients.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {recipients.map((email) => (
                  <Chip
                    key={email}
                    label={email}
                    onDelete={() => handleRemoveRecipient(email)}
                    icon={<EmailIcon />}
                    sx={{
                      backgroundColor: '#ff9f43',
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'white',
                      },
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <TextField
            fullWidth
            label="Subject"
            name="subject"
            value={emailData.subject}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Message"
            name="message"
            value={emailData.message}
            onChange={handleInputChange}
            margin="normal"
            required
            multiline
            rows={6}
          />

          <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<AttachFileIcon />}
              sx={{ 
                borderColor: '#ff9f43',
                color: '#ff9f43',
                '&:hover': {
                  borderColor: '#ff9f43dd',
                  backgroundColor: 'rgba(255, 159, 67, 0.08)',
                }
              }}
            >
              Attach File
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {emailData.attachment && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {emailData.attachment.name}
                </Typography>
                <IconButton size="small" onClick={handleRemoveAttachment}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handlePreview}
              sx={{
                borderColor: '#ff9f43',
                color: '#ff9f43',
                '&:hover': {
                  borderColor: '#ff9f43dd',
                  backgroundColor: 'rgba(255, 159, 67, 0.08)',
                }
              }}
            >
              Preview
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={loading || recipients.length === 0}
              sx={{
                backgroundColor: '#ff9f43',
                '&:hover': {
                  backgroundColor: '#ff9f43dd',
                },
                '&:disabled': {
                  backgroundColor: '#ff9f4380',
                }
              }}
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#ff9f43', fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>
          Email Preview
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              To:
            </Typography>
            <Box sx={{ mb: 2 }}>
              {recipients.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  icon={<EmailIcon />}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Subject:
            </Typography>
            <Typography variant="body1" paragraph>
              {emailData.subject}
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Message:
            </Typography>
            <Typography variant="body1" paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {emailData.message}
            </Typography>

            {emailData.attachment && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Attachment:
                </Typography>
                <Typography variant="body1">
                  {emailData.attachment.name}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} sx={{ color: '#ff9f43', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Email; 