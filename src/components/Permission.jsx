"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  Checkbox,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";

const Permission = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [permissionData, setPermissionData] = useState({
    canEditBasicInfo: false,
    basicInfoFields: {
      firstName: false,
      lastName: false,
    },
    canEditPersonalInfo: false,
    personalInfoFields: {
      phone: false,
      address: false,
      emergencyContact: false,
    },
    reason: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const isManagement = user?.role === "management";

  useEffect(() => {
    if (isManagement) {
      fetchEmployees();
    }
  }, [isManagement]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch("/api/management/permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch permissions");

      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch employee permissions",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      // Editing existing permission
      setEditingPermission(employee.permission);
      setSelectedEmployee(employee._id);
      setPermissionData({
        canEditBasicInfo: employee.permission?.canEditBasicInfo || false,
        basicInfoFields: {
          firstName: employee.permission?.basicInfoFields?.firstName || false,
          lastName: employee.permission?.basicInfoFields?.lastName || false,
        },
        canEditPersonalInfo: employee.permission?.canEditPersonalInfo || false,
        personalInfoFields: {
          phone: employee.permission?.personalInfoFields?.phone || false,
          address: employee.permission?.personalInfoFields?.address || false,
          emergencyContact: employee.permission?.personalInfoFields?.emergencyContact || false,
        },
        reason: employee.permission?.reason || "",
      });
    } else {
      // Creating new permission
      setEditingPermission(null);
      setSelectedEmployee("");
      setPermissionData({
        canEditBasicInfo: false,
        basicInfoFields: {
          firstName: false,
          lastName: false,
        },
        canEditPersonalInfo: false,
        personalInfoFields: {
          phone: false,
          address: false,
          emergencyContact: false,
        },
        reason: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPermission(null);
    setSelectedEmployee("");
    setPermissionData({
      canEditBasicInfo: false,
      basicInfoFields: {
        firstName: false,
        lastName: false,
      },
      canEditPersonalInfo: false,
      personalInfoFields: {
        phone: false,
        address: false,
        emergencyContact: false,
      },
      reason: "",
    });
  };

  const handleSavePermission = async () => {
    if (!selectedEmployee) {
      setSnackbar({
        open: true,
        message: "Please select an employee",
        severity: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      const url = editingPermission
        ? "/api/management/permissions"
        : "/api/management/permissions";
      
      const method = editingPermission ? "PUT" : "POST";
      
      const body = editingPermission
        ? {
            permissionId: editingPermission._id,
            ...permissionData,
          }
        : {
            employeeId: selectedEmployee,
            ...permissionData,
          };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save permission");

      const data = await response.json();
      setSnackbar({
        open: true,
        message: data.message || "Permission saved successfully",
        severity: "success",
      });

      handleCloseDialog();
      fetchEmployees();
    } catch (error) {
      console.error("Error saving permission:", error);
      setSnackbar({
        open: true,
        message: "Failed to save permission",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId) => {
    if (!window.confirm("Are you sure you want to revoke this permission?")) {
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/management/permissions?permissionId=${permissionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to revoke permission");

      setSnackbar({
        open: true,
        message: "Permission revoked successfully",
        severity: "success",
      });

      fetchEmployees();
    } catch (error) {
      console.error("Error revoking permission:", error);
      setSnackbar({
        open: true,
        message: "Failed to revoke permission",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getEmployeesWithoutPermissions = () => {
    return employees.filter((emp) => !emp.permission);
  };

  const getEmployeesWithPermissions = () => {
    return employees.filter((emp) => emp.permission);
  };

  const renderPermissionChips = (permission) => {
    const chips = [];
    
    if (permission.canEditBasicInfo) {
      if (permission.basicInfoFields?.firstName) {
        chips.push(<Chip key="firstName" label="First Name" size="small" color="primary" />);
      }
      if (permission.basicInfoFields?.lastName) {
        chips.push(<Chip key="lastName" label="Last Name" size="small" color="primary" />);
      }
    }
    
    if (permission.canEditPersonalInfo) {
      if (permission.personalInfoFields?.phone) {
        chips.push(<Chip key="phone" label="Phone" size="small" color="secondary" />);
      }
      if (permission.personalInfoFields?.address) {
        chips.push(<Chip key="address" label="Address" size="small" color="secondary" />);
      }
      if (permission.personalInfoFields?.emergencyContact) {
        chips.push(<Chip key="emergency" label="Emergency Contact" size="small" color="secondary" />);
      }
    }

    return chips.length > 0 ? chips : [<Chip key="none" label="No permissions" size="small" />];
  };

  if (!isManagement) {
    return (
      <Box sx={{ p: 4, textAlign: "center", minHeight: "60vh" }}>
        <SecurityIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h4" color="primary" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Only management can access the permissions page.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading permissions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: "primary.main", fontWeight: 600 }}>
          Employee Permissions Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Grant or revoke permissions for employees to edit their personal information.
        </Typography>

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
          disabled={getEmployeesWithoutPermissions().length === 0}
        >
          Grant Permission
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Employees with Permissions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Employees with Permissions ({getEmployeesWithPermissions().length})
            </Typography>
            
            {getEmployeesWithPermissions().length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No employees have been granted permissions yet.
              </Alert>
            ) : (
              <List>
                {getEmployeesWithPermissions().map((employee, index) => (
                  <div key={employee._id}>
                    <ListItem sx={{ px: 0 }}>
                      <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                        {employee.firstName?.[0] || employee.email[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {employee.firstName && employee.lastName
                                ? `${employee.firstName} ${employee.lastName}`
                                : employee.email}
                            </Typography>
                            <Chip
                              label={employee.employeeId}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {employee.email}
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {renderPermissionChips(employee.permission)}
                            </Box>
                            {employee.permission.reason && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                Reason: {employee.permission.reason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit Permissions">
                          <IconButton onClick={() => handleOpenDialog(employee)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke Permissions">
                          <IconButton 
                            onClick={() => handleRevokePermission(employee.permission._id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < getEmployeesWithPermissions().length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Summary
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                    {employees.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                    {getEmployeesWithPermissions().length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Permissions
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                    {getEmployeesWithoutPermissions().length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Without Permissions
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Permission Types
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label="Basic Info" size="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  Name fields
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label="Personal Info" size="small" color="secondary" />
                <Typography variant="caption" color="text.secondary">
                  Contact & address
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Permission Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingPermission ? "Edit Permissions" : "Grant Permissions"}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {!editingPermission && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Employee</InputLabel>
              <Select
                value={selectedEmployee}
                label="Select Employee"
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                {getEmployeesWithoutPermissions().map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    <Box>
                      <Typography variant="body2">
                        {employee.firstName && employee.lastName
                          ? `${employee.firstName} ${employee.lastName}`
                          : employee.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.employeeId} • {employee.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={permissionData.canEditBasicInfo}
                  onChange={(e) =>
                    setPermissionData({
                      ...permissionData,
                      canEditBasicInfo: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Basic Information</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow editing of name fields
                  </Typography>
                </Box>
              }
            />
            
            {permissionData.canEditBasicInfo && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.basicInfoFields.firstName}
                        onChange={(e) =>
                          setPermissionData({
                            ...permissionData,
                            basicInfoFields: {
                              ...permissionData.basicInfoFields,
                              firstName: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="First Name"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.basicInfoFields.lastName}
                        onChange={(e) =>
                          setPermissionData({
                            ...permissionData,
                            basicInfoFields: {
                              ...permissionData.basicInfoFields,
                              lastName: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Last Name"
                  />
                </FormGroup>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={permissionData.canEditPersonalInfo}
                  onChange={(e) =>
                    setPermissionData({
                      ...permissionData,
                      canEditPersonalInfo: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Personal Information</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow editing of contact and address fields
                  </Typography>
                </Box>
              }
            />
            
            {permissionData.canEditPersonalInfo && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.personalInfoFields.phone}
                        onChange={(e) =>
                          setPermissionData({
                            ...permissionData,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              phone: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Phone Number"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.personalInfoFields.address}
                        onChange={(e) =>
                          setPermissionData({
                            ...permissionData,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              address: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Address"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.personalInfoFields.emergencyContact}
                        onChange={(e) =>
                          setPermissionData({
                            ...permissionData,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              emergencyContact: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Emergency Contact"
                  />
                </FormGroup>
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Reason (Optional)"
            multiline
            rows={3}
            value={permissionData.reason}
            onChange={(e) =>
              setPermissionData({
                ...permissionData,
                reason: e.target.value,
              })
            }
            placeholder="Specify the reason for granting these permissions..."
            sx={{ borderRadius: 2 }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSavePermission}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckIcon />}
            sx={{ borderRadius: 2 }}
          >
            {editingPermission ? "Update" : "Grant"} Permission
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default Permission;
