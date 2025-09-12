import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
} from '@mui/icons-material';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../../api/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const handleEdit = (userId) => {
    const userToEdit = users.find(user => user._id === userId);
    if (userToEdit) {
      setEditingUser({
        _id: userToEdit._id,
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        email: userToEdit.email,
        mobile: userToEdit.mobile,
        role: userToEdit.role._id || userToEdit.role,
        status: userToEdit.status
      });
      setOpenEditDialog(true);
    }
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(editingUser._id, editingUser);
      toast.success('User updated successfully');
      setOpenEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'role', 'password'];
      const missingFields = requiredFields.filter(field => !newUser[field]);
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate password confirmation
      if (newUser.password !== newUser.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Create user data object without confirmPassword
      const userData = { ...newUser };
      delete userData.confirmPassword;

      await createUser(userData);
      toast.success('User created successfully');
      setOpenCreateDialog(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        role: '',
        password: '',
        confirmPassword: '',
        status: 'Active'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to export data as Excel
  const handleExportExcel = () => {
    try {
      const exportData = users.map(user => ({
        'Name': `${user.firstName} ${user.lastName}`,
        'Email': user.email,
        'Mobile': user.mobile,
        'Role': user.role?.name || 'No Role',
        'Status': user.status,
        'Created At': format(new Date(user.createdAt), 'dd/MM/yyyy')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
      XLSX.writeFile(wb, 'users_list.xlsx');
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Function to export data as PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(15);
      doc.text('Users List Report', 14, 15);

      // Define the table
      const tableColumn = ['Name', 'Email', 'Mobile', 'Role', 'Status', 'Created At'];
      const tableRows = users.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.mobile,
        user.role?.name || 'No Role',
        user.status,
        format(new Date(user.createdAt), 'dd/MM/yyyy')
      ]);

      // Generate the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [255, 159, 67],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 25 },
      });

      // Save the PDF
      doc.save('users_list.pdf');
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9f43' }}>
          USERS LIST
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
            sx={{ mr: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<ExcelIcon />}
            onClick={handleExportExcel}
            sx={{ mr: 1, bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              backgroundColor: '#ff9f43',
              color: 'white',
              '&:hover': {
                backgroundColor: '#e8890a',
              },
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : users
            ).map((user) => (
              <TableRow key={user._id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile}</TableCell>
                <TableCell>{user.role?.name || 'No Role'}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEdit(user._id)}
                    sx={{ color: '#ff9800' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(user._id)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
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
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          color: '#ff9f43',
          fontWeight: 600
        }}>
          Create User
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>First Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Last Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Email</Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Mobile</Typography>
              <TextField
                fullWidth
                size="small"
                value={newUser.mobile}
                onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Role</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Password</Typography>
              <TextField
                fullWidth
                size="small"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Confirm Password</Typography>
              <TextField
                fullWidth
                size="small"
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={newUser.status}
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} sx={{ color: '#ff9f43', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" sx={{ backgroundColor: '#ff9f43', color: 'white', '&:hover': { backgroundColor: '#e8890a' } }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          color: '#ff9f43',
          fontWeight: 600
        }}>
          Edit User
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>First Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={editingUser?.firstName || ''}
                onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Last Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={editingUser?.lastName || ''}
                onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Email</Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Mobile</Typography>
              <TextField
                fullWidth
                size="small"
                value={editingUser?.mobile || ''}
                onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Role</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={editingUser?.role || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={editingUser?.status || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ color: '#ff9f43', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" sx={{ backgroundColor: '#ff9f43', color: 'white', '&:hover': { backgroundColor: '#e8890a' } }}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UsersList; 