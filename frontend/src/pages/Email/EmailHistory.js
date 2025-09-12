import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { emailAPI } from '../../services/api';

function EmailHistory() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getHistory();
      setEmails(response.data);
    } catch (error) {
      console.error('Error fetching email history:', error);
      toast.error('Failed to load email history');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewDetails = (email) => {
    setSelectedEmail(email);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedEmail(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
          Email History
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress sx={{ color: '#ff9f43' }} />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emails
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((email) => (
                      <TableRow hover key={email._id}>
                        <TableCell>{formatDate(email.createdAt)}</TableCell>
                        <TableCell>{email.to}</TableCell>
                        <TableCell>{email.subject}</TableCell>
                        <TableCell>
                          <Chip
                            label={email.status}
                            color={email.status === 'Sent' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(email)}
                              sx={{ color: '#ff9f43' }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={emails.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '.MuiTablePagination-select': {
                color: '#ff9f43',
              },
              '.MuiTablePagination-selectIcon': {
                color: '#ff9f43',
              },
              '.MuiTablePagination-displayedRows': {
                color: '#666',
              },
            }}
          />
          </>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>Email Details</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmail && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Date:</strong> {formatDate(selectedEmail.createdAt)}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>To:</strong> {selectedEmail.to}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Subject:</strong> {selectedEmail.subject}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong>{' '}
                <Chip
                  label={selectedEmail.status}
                  color={selectedEmail.status === 'Sent' ? 'success' : 'error'}
                  size="small"
                />
              </Typography>
              {selectedEmail.attachmentName && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Attachment:</strong> {selectedEmail.attachmentName}
                </Typography>
              )}
              <Typography variant="subtitle1" gutterBottom>
                <strong>Message:</strong>
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedEmail.message}
                </Typography>
              </Paper>
              {selectedEmail.error && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" color="error" gutterBottom>
                    <strong>Error:</strong>
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#fff3f3' }}>
                    <Typography variant="body1" color="error">
                      {selectedEmail.error}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant="contained" sx={{
            backgroundColor: '#ff9f43',
            '&:hover': { backgroundColor: '#ff9f43dd' }
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default EmailHistory; 