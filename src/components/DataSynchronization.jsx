import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  CleaningServices as CleanupIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  People as PeopleIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const DataSynchronization = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [syncDialog, setSyncDialog] = useState({ open: false, action: '', title: '', description: '' });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeesWithoutNames, setEmployeesWithoutNames] = useState([]);
  const [outdatedMappings, setOutdatedMappings] = useState([]);

  // Fetch synchronization status
  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/management/sync-data');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
        setEmployeesWithoutNames(data.employeesWithoutNames || []);
        setOutdatedMappings(data.potentiallyOutdatedMappings || []);
      } else {
        setAlert({
          open: true,
          message: data.error || 'Failed to fetch synchronization status',
          severity: 'error'
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: 'Error fetching synchronization status: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger synchronization
  const triggerSync = async (action, userIds = []) => {
    try {
      setLoading(true);
      const response = await fetch('/api/management/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIds
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlert({
          open: true,
          message: data.message || 'Synchronization completed successfully',
          severity: 'success'
        });
        
        // Refresh statistics
        await fetchSyncStatus();
      } else {
        setAlert({
          open: true,
          message: data.error || 'Synchronization failed',
          severity: 'error'
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: 'Error during synchronization: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSyncDialog({ open: false, action: '', title: '', description: '' });
    }
  };

  // Open synchronization dialog
  const openSyncDialog = (action, title, description) => {
    setSyncDialog({
      open: true,
      action,
      title,
      description
    });
  };

  // Handle employee selection
  const handleEmployeeSelection = (employeeId, checked) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  // Select all employees
  const selectAllEmployees = () => {
    const allEmployeeIds = employeesWithoutNames.map(emp => emp._id);
    setSelectedEmployees(allEmployeeIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Data Synchronization
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage and synchronize employee data across all system components. This ensures that name and position changes are reflected everywhere.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PeopleIcon color="primary" />
                <Box>
                  <Typography variant="h6" color="primary">
                    {statistics?.totalEmployees || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmailIcon color="info" />
                <Box>
                  <Typography variant="h6" color="info.main">
                    {statistics?.totalPositionMappings || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email Mappings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" />
                <Box>
                  <Typography variant="h6" color="warning.main">
                    {statistics?.employeesWithoutProperNames || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incomplete Names
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SyncIcon color="error" />
                <Box>
                  <Typography variant="h6" color="error.main">
                    {statistics?.potentiallyOutdatedMappings || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Outdated Mappings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchSyncStatus}
            disabled={loading}
          >
            Refresh Status
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => openSyncDialog('sync_all', 'Synchronize All Data', 'This will synchronize all employee data across all system components. This may take a few minutes.')}
            disabled={loading}
          >
            Sync All Data
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<CleanupIcon />}
            onClick={() => openSyncDialog('cleanup_orphaned', 'Clean Up Orphaned Data', 'This will identify and clean up orphaned position email mappings that no longer have corresponding employee records.')}
            disabled={loading}
          >
            Cleanup Orphaned Data
          </Button>
        </Grid>
      </Grid>

      {/* Employees without proper names */}
      {employeesWithoutNames.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Employees with Incomplete Names ({employeesWithoutNames.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These employees have missing or incomplete first/last names. Please update their profiles.
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                onClick={selectAllEmployees}
                sx={{ mr: 1 }}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={clearSelection}
                sx={{ mr: 1 }}
              >
                Clear Selection
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={selectedEmployees.length === 0}
                onClick={() => triggerSync('sync_single', selectedEmployees)}
              >
                Sync Selected ({selectedEmployees.length})
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedEmployees.length === employeesWithoutNames.length}
                        indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employeesWithoutNames.length}
                        onChange={(e) => e.target.checked ? selectAllEmployees() : clearSelection()}
                      />
                    </TableCell>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeesWithoutNames.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployees.includes(employee._id)}
                          onChange={(e) => handleEmployeeSelection(employee._id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        {employee.firstName || <Chip label="Missing" size="small" color="error" />}
                      </TableCell>
                      <TableCell>
                        {employee.lastName || <Chip label="Missing" size="small" color="error" />}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={(!employee.firstName || !employee.lastName) ? "Incomplete" : "Complete"} 
                          size="small" 
                          color={(!employee.firstName || !employee.lastName) ? "error" : "success"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Outdated mappings */}
      {outdatedMappings.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SyncIcon color="error" />
              Potentially Outdated Mappings ({outdatedMappings.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These position email mappings may have outdated employee names or positions.
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Name</TableCell>
                    <TableCell>Expected Name</TableCell>
                    <TableCell>Current Position</TableCell>
                    <TableCell>Expected Position</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outdatedMappings.map((mapping) => (
                    <TableRow key={mapping.mappingId}>
                      <TableCell>{mapping.email}</TableCell>
                      <TableCell>
                        {mapping.currentName !== mapping.expectedName ? (
                          <Chip label={mapping.currentName} size="small" color="error" />
                        ) : (
                          mapping.currentName
                        )}
                      </TableCell>
                      <TableCell>{mapping.expectedName}</TableCell>
                      <TableCell>
                        {mapping.currentPosition !== mapping.expectedPosition ? (
                          <Chip label={mapping.currentPosition} size="small" color="error" />
                        ) : (
                          mapping.currentPosition
                        )}
                      </TableCell>
                      <TableCell>{mapping.expectedPosition}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => triggerSync('sync_single', [mapping.email])}
                        >
                          Fix
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Success message when everything is synchronized */}
      {statistics && 
       statistics.employeesWithoutProperNames === 0 && 
       statistics.potentiallyOutdatedMappings === 0 && (
        <Alert severity="success">
          <AlertTitle>All Data Synchronized</AlertTitle>
          All employee data is properly synchronized across the system. No action required.
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={syncDialog.open} onClose={() => setSyncDialog({ open: false, action: '', title: '', description: '' })}>
        <DialogTitle>{syncDialog.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {syncDialog.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialog({ open: false, action: '', title: '', description: '' })}>
            Cancel
          </Button>
          <Button
            onClick={() => triggerSync(syncDialog.action)}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <PlayIcon />}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      {alert.open && (
        <Alert 
          severity={alert.severity} 
          onClose={() => setAlert({ open: false, message: '', severity: 'info' })}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1300 }}
        >
          {alert.message}
        </Alert>
      )}
    </Box>
  );
};

export default DataSynchronization;
