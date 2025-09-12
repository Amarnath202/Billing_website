import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { getRoles, createRole, deleteRole, updateRole } from '../../api/api';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

// Define available modules and their groups
const MODULE_GROUPS = {
  'Contacts': ['Customers', 'Suppliers'],
  'Sales': ['Sales Invoice', 'Barcode', 'Sales History', 'Payment In', 'Sales Order', 'Sales Cash & Bank', 'Sales Return'],
  'Purchases': ['Payment Out', 'Purchase', 'Purchase Cash & Bank', 'Purchase Return'],
  'Items': ['Products', 'Brands', 'Categories', 'Warehouses'],
  'Expenses': ['Expenses List'],
  'Reports': ['Profit and Loss', 'Purchase Report', 'Sales Report', 'Product Report', 'Expense Report'],
  'Email': ['Send Email', 'Email History'],
  'Settings': ['Profile', 'App Settings', 'Tax', 'Discount', 'Users', 'Roles']
};
// Flatten modules for easier access
const AVAILABLE_MODULES = Object.values(MODULE_GROUPS).flat();

function Roles() {
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newRole, setNewRole] = useState({
    name: '',
    status: 'Active',
    permissions: AVAILABLE_MODULES.map(module => ({
      module: module,
      visible: false
    }))
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const handleSelectAllForModule = (moduleName, checked, isEditing = false) => {  
    const stateUpdater = isEditing ? setEditingRole : setNewRole;
    stateUpdater(prev => {
      const newPermissions = [...prev.permissions];
      const moduleIndex = newPermissions.findIndex(p => p.module === moduleName);
      if (moduleIndex !== -1) {
        newPermissions[moduleIndex] = {
          module: moduleName,
          visible: checked
        };
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleVisibilityChange = (moduleName, checked, isEditing = false) => {
    const stateUpdater = isEditing ? setEditingRole : setNewRole;
    stateUpdater(prev => {
      const newPermissions = [...prev.permissions];
      const moduleIndex = newPermissions.findIndex(p => p.module === moduleName);
      if (moduleIndex !== -1) {
        newPermissions[moduleIndex] = {
          module: moduleName,
          visible: checked
        };
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleCreateRole = async () => {
    try {
      // Filter out modules that are not visible
      const filteredPermissions = newRole.permissions.filter(
        perm => perm.visible
      );
      
      const roleData = {
        ...newRole,
        permissions: filteredPermissions
      };

      await createRole(roleData);
      toast.success('Role created successfully');
      setOpenCreateDialog(false);
      setNewRole({
        name: '',
        status: 'Active',
        permissions: AVAILABLE_MODULES.map(module => ({
          module: module,
          visible: false
        }))
      });
      fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error(error.response?.data?.msg || 'Failed to create role');
    }
  };

  const handleEditRole = async () => {
    try {
      // Filter out modules that are not visible
      const filteredPermissions = editingRole.permissions.filter(
        perm => perm.visible
      );
      
      const roleData = {
        ...editingRole,
        permissions: filteredPermissions
      };

      await updateRole(editingRole._id, roleData);
      toast.success('Role updated successfully');
      setOpenEditDialog(false);
      setEditingRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.msg || 'Failed to update role');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedRoles.map(roleId => deleteRole(roleId))
      );
      toast.success('Selected roles deleted successfully');
      setSelectedRoles([]);
      fetchRoles();
    } catch (error) {
      console.error('Error deleting roles:', error);
      toast.error('Failed to delete selected roles');
    }
  };

  const handleOpenEditDialog = (role) => {
    // Ensure all modules are represented in permissions
    const fullPermissions = AVAILABLE_MODULES.map(module => {
      const existingPermission = role.permissions.find(p => p.module === module);
      return existingPermission || { module, visible: false };
    });

    setEditingRole({
      ...role,
      permissions: fullPermissions
    });
    setOpenEditDialog(true);
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
      const exportData = roles.map(role => {
        const visibleModules = role.permissions
          .filter(p => p.visible)
          .map(p => p.module)
          .join(', ');

        return {
          'Role Name': role.name,
          'Status': role.status,
          'Visible Modules': visibleModules,
          'Created At': format(new Date(role.createdAt), 'dd/MM/yyyy')
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Roles');
      XLSX.writeFile(wb, 'roles_list.xlsx');
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
      doc.text('Roles List Report', 14, 15);

      // Define the table
      const tableColumn = ['Role Name', 'Status', 'Visible Modules', 'Created At'];
      const tableRows = roles.map(role => [
        role.name,
        role.status,
        role.permissions
          .filter(p => p.visible)
          .map(p => p.module)
          .join(', '),
        format(new Date(role.createdAt), 'dd/MM/yyyy')
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
      doc.save('roles_list.pdf');
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderModuleTable = (isEditing = false) => {
    const roleData = isEditing ? editingRole : newRole;
    
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#FF9800' }}>GROUP</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#FF9800' }}>MODULE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#FF9800' }}>VISIBILITY</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(MODULE_GROUPS).map(([groupName, moduleNames]) => (
              <React.Fragment key={groupName}>
                {moduleNames.map((moduleName, index) => {
                  const modulePermission = roleData.permissions.find(p => p.module === moduleName);
                  const isVisible = modulePermission?.visible || false;
                  
                  return (
                    <TableRow key={moduleName} sx={index === 0 ? { borderTop: '2px solid #eee' } : {}}>
                      {index === 0 && (
                        <TableCell rowSpan={moduleNames.length} sx={{ backgroundColor: '#f5f5f5' }}>
                          {groupName}
                        </TableCell>
                      )}
                      <TableCell>{moduleName}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isVisible}
                              onChange={(e) => handleVisibilityChange(moduleName, e.target.checked, isEditing)}
                            />
                          }
                          label={isVisible ? "Visible" : "Not Visible"}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9f43' }}>
          ROLES LIST
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
            Add Role
          </Button>
        </Box>
      </Box>

      {/* Table Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* Roles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles(roles.map(role => role._id));
                    } else {
                      setSelectedRoles([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>Role Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Visible Modules</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : filteredRoles
            ).map((role) => (
              <TableRow key={role._id}>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role._id]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role._id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.status}</TableCell>
                <TableCell>
                  {role.permissions
                    .filter(p => p.visible)
                    .map(p => p.module)
                    .join(', ')}
                </TableCell>
                <TableCell>{format(new Date(role.createdAt), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleOpenEditDialog(role)}
                    sx={{ color: '#ff9800' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => {
                      setSelectedRoles([role._id]);
                      handleDeleteSelected();
                    }}
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
          count={filteredRoles.length}
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

      {/* Create Role Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          color: '#ff9f43',
          fontWeight: 600
        }}>
          Create New Role
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Role Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Status
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={newRole.status}
                onChange={(e) => setNewRole({ ...newRole, status: e.target.value })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Module Visibility
          </Typography>
          
          {renderModuleTable(false)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} sx={{ color: '#ff9f43', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleCreateRole}    
            variant="contained" 
          
            sx={{ 
              backgroundColor: '#ff9f43', 
              color: 'white', 
              '&:hover': { 
                backgroundColor: '#e8890a' 
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(255, 159, 67, 0.5)',
                color: 'white'
              }
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          color: '#ff9f43',
          fontWeight: 600
        }}>
          Edit Role
        </DialogTitle>
        <DialogContent>
          {editingRole && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Role Name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={editingRole.status}
                    onChange={(e) => setEditingRole({ ...editingRole, status: e.target.value })}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Module Visibility
              </Typography>
              
              {renderModuleTable(true)}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ color: '#ff9f43', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleEditRole} 
            variant="contained"
            disabled={!editingRole?.name}
            sx={{ backgroundColor: '#ff9f43', color: 'white', '&:hover': { backgroundColor: '#e8890a' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Roles; 