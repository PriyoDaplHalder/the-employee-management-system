"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  const [employeeProjects, setEmployeeProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  // Cache for storing project names by project ID
  const [projectNamesCache, setProjectNamesCache] = useState({});
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
      skills: false,
    },
    projectPermissions: [],
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
      const employeesData = data.employees || [];
      setEmployees(employeesData);

      // Extract all unique project IDs from permissions and fetch their names
      const allProjectIds = new Set();
      employeesData.forEach((employee) => {
        if (employee.permission?.projectPermissions) {
          employee.permission.projectPermissions.forEach((projPerm) => {
            if (projPerm.projectId) {
              allProjectIds.add(projPerm.projectId);
            }
          });
        }
      });

      // Fetch project names for all project IDs
      if (allProjectIds.size > 0) {
        await fetchProjectNames(Array.from(allProjectIds));
      }
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

  const fetchEmployeeProjects = async (
    employeeId,
    preselectProjects = null
  ) => {
    if (!employeeId) return;

    setProjectsLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/management/employee-projects?employeeId=${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from API: ${errorText}`);
        throw new Error(
          `Failed to fetch employee projects: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      // console.log("Fetched projects:", data);

      const projects = data.projects || [];
      setEmployeeProjects(projects);

      // Update project names cache with the fetched projects
      const newCache = { ...projectNamesCache };
      projects.forEach((project) => {
        newCache[project._id] = project.name;
      });
      setProjectNamesCache(newCache);

      // Always preselect projects if provided (for edit)
      if (preselectProjects) {
        setSelectedProjects(preselectProjects);
      } else {
        setSelectedProjects([]);
      }
    } catch (error) {
      console.error("Error fetching employee projects:", error);
      setSnackbar({
        open: true,
        message: `Failed to fetch employee projects: ${error.message}`,
        severity: "error",
      });
      setEmployeeProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Function to fetch project names for given project IDs
  const fetchProjectNames = async (projectIds) => {
    try {
      const token = getToken();
      const response = await fetch("/api/management/project-names", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectIds }),
      });

      if (!response.ok) {
        // If the API endpoint doesn't exist, fall back to individual project fetches
        console.warn(
          "Project names API not available, project IDs will be displayed"
        );
        return;
      }

      const data = await response.json();
      const newCache = { ...projectNamesCache };
      data.projects?.forEach((project) => {
        newCache[project._id] = project.name;
      });
      setProjectNamesCache(newCache);
    } catch (error) {
      console.warn("Error fetching project names:", error);
      // Fail silently and fall back to showing project IDs
    }
  };

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      // Editing existing permission (do NOT reset state)
      setEditingPermission(employee.permission);
      setSelectedEmployee(employee._id);
      // Set selectedProjects to previously selected projects for this employee
      const projectIds = Array.isArray(employee.permission?.projectPermissions)
        ? employee.permission.projectPermissions.map((p) => p.projectId)
        : [];
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
          emergencyContact:
            employee.permission?.personalInfoFields?.emergencyContact || false,
          skills: employee.permission?.personalInfoFields?.skills || false,
        },
        projectPermissions: Array.isArray(
          employee.permission?.projectPermissions
        )
          ? employee.permission.projectPermissions
          : [],
        reason: employee.permission?.reason || "",
      });
      fetchEmployeeProjects(employee._id, projectIds);
    } else {
      // Resetting state when granting new permission
      setEmployeeProjects([]);
      setSelectedProjects([]);
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
          skills: false,
        },
        projectPermissions: [],
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
        skills: false,
      },
      projectPermissions: [],
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

    // Validate that at least one permission is granted
    const hasBasicPermissions =
      permissionData.canEditBasicInfo &&
      (permissionData.basicInfoFields?.firstName ||
        permissionData.basicInfoFields?.lastName);

    const hasPersonalPermissions =
      permissionData.canEditPersonalInfo &&
      (permissionData.personalInfoFields?.phone ||
        permissionData.personalInfoFields?.address ||
        permissionData.personalInfoFields?.emergencyContact ||
        permissionData.personalInfoFields?.skills);

    // --- Ensure projectPermissions includes projectName for each entry ---
    const projectPermissions = (permissionData.projectPermissions || []).map(
      (p) => {
        // If projectName is already present, keep it; otherwise, look up from employeeProjects
        if (p.projectName) return p;
        const project = employeeProjects.find(
          (proj) => proj._id === p.projectId
        );
        return {
          ...p,
          projectName: project ? project.name : p.projectId,
        };
      }
    );
    const hasProjectPermissions =
      projectPermissions.length > 0 &&
      projectPermissions.some(
        (p) => p.canEditMilestone || p.canEditSRS || p.canEditOtherDocs
      );

    if (
      !hasBasicPermissions &&
      !hasPersonalPermissions &&
      !hasProjectPermissions
    ) {
      setSnackbar({
        open: true,
        message: "Please grant at least one permission",
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
            projectPermissions: projectPermissions, // override with project names included
          }
        : {
            employeeId: selectedEmployee,
            ...permissionData,
            projectPermissions: projectPermissions, // override with project names included
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
        chips.push(
          <Chip
            key="firstName"
            label="First Name"
            sx={{ pointerEvents: "none" }}
            size="small"
            color="primary"
          />
        );
      }
      if (permission.basicInfoFields?.lastName) {
        chips.push(
          <Chip
            key="lastName"
            label="Last Name"
            sx={{ pointerEvents: "none" }}
            size="small"
            color="primary"
          />
        );
      }
    }

    if (permission.canEditPersonalInfo) {
      if (permission.personalInfoFields?.phone) {
        chips.push(
          <Chip
            key="phone"
            label="Phone"
            sx={{ pointerEvents: "none" }}
            size="small"
            color="primary"
          />
        );
      }
      if (permission.personalInfoFields?.address) {
        chips.push(
          <Chip
            key="address"
            label="Address"
            sx={{ pointerEvents: "none" }}
            size="small"
            color="primary"
          />
        );
      }
      if (permission.personalInfoFields?.emergencyContact) {
        chips.push(
          <Chip
            key="emergency"
            label="Emergency Contact"
            sx={{ pointerEvents: "none" }}
            size="small"
            color="primary"
          />
        );
      }
      if (permission.personalInfoFields?.skills) {
        chips.push(
          <Chip
            key="skills"
            label="Skills"
            sx={{ pointerEvents: "none" }}
            size="small"
            color="primary"
          />
        );
      }
    }

    if (
      permission.projectPermissions &&
      permission.projectPermissions.length > 0
    ) {
      permission.projectPermissions.forEach((projPerm) => {
        // First try to get project name from the permission data, then from cache, then fallback to ID
        let projectName = projPerm.projectName || projPerm.name;
        if (!projectName && projPerm.projectId) {
          projectName = projectNamesCache[projPerm.projectId];
        }
        // Final fallback to project ID
        projectName = projectName || projPerm.projectId || "Unknown Project";

        if (projPerm.canEditMilestone) {
          chips.push(
            <Chip
              key={`milestone-${projPerm.projectId}`}
              label={`${projectName} - Milestone Edit Access`}
              sx={{ pointerEvents: "none" }}
              size="small"
              color="primary"
            />
          );
        }
        if (projPerm.canEditSRS) {
          chips.push(
            <Chip
              key={`srs-${projPerm.projectId}`}
              label={`${projectName} - SRS Edit Access`}
              sx={{ pointerEvents: "none" }}
              size="small"
              color="primary"
            />
          );
        }
        if (projPerm.canEditOtherDocs) {
          chips.push(
            <Chip
              key={`other-docs-${projPerm.projectId}`}
              label={`${projectName} - Other Docs Edit Access`}
              sx={{ pointerEvents: "none" }}
              size="small"
              color="primary"
            />
          );
        }
      });
    } else {
      chips.push(
        <Chip
          key="noProjectPermissions"
          sx={{ pointerEvents: "none" }}
          label="No project permissions"
          size="small"
        />
      );
    }

    return chips.length > 0
      ? chips
      : [
          <Chip
            key="none"
            sx={{ pointerEvents: "none" }}
            label="No permissions"
            size="small"
          />,
        ];
  };

  useEffect(() => {
    if (selectedEmployee && !editingPermission) {
      fetchEmployeeProjects(selectedEmployee);
    }
  }, [selectedEmployee]);

  // When a project is selected or unselected, update the project permissions
  useEffect(() => {
    // If editing, allow updating projectPermissions when selectedProjects changes
    if (!selectedProjects || selectedProjects.length === 0) {
      setPermissionData((prev) => ({
        ...prev,
        projectPermissions: [],
      }));
      return;
    }
    const newProjectPermissions = selectedProjects.map((projectId) => {
      // Always try to find existing permission for this project
      const existingPermission = permissionData.projectPermissions?.find(
        (p) => p.projectId === projectId
      );
      // If it does, keep those permissions, otherwise set default permissions
      return (
        existingPermission || {
          projectId,
          canEditMilestone: false,
          canEditSRS: false,
          canEditOtherDocs: false,
        }
      );
    });
    setPermissionData((prev) => ({
      ...prev,
      projectPermissions: newProjectPermissions,
    }));
  }, [selectedProjects]);

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
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          Employee Permissions Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Grant or revoke permissions for employees to edit their personal
          information.
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
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Employees with Permissions ({getEmployeesWithPermissions().length}
              )
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
                        {employee.firstName?.[0] ||
                          employee.email[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600 }}
                            >
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
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {employee.email}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {renderPermissionChips(employee.permission)}
                            </Box>
                            {employee.permission.reason && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 1, display: "block" }}
                              >
                                Reason: {employee.permission.reason}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: "span" }}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit Permissions">
                          <IconButton
                            onClick={() => handleOpenDialog(employee)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke Permissions">
                          <IconButton
                            onClick={() =>
                              handleRevokePermission(employee.permission._id)
                            }
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < getEmployeesWithPermissions().length - 1 && (
                      <Divider />
                    )}
                  </div>
                ))}
              </List>
            )}
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
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
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
                      basicInfoFields: e.target.checked
                        ? permissionData.basicInfoFields
                        : {
                            firstName: false,
                            lastName: false,
                          },
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
                        onChange={(e) => {
                          const newFirstNameValue = e.target.checked;
                          const lastNameEnabled =
                            permissionData.basicInfoFields.lastName;

                          setPermissionData({
                            ...permissionData,
                            canEditBasicInfo:
                              newFirstNameValue || lastNameEnabled,
                            basicInfoFields: {
                              ...permissionData.basicInfoFields,
                              firstName: newFirstNameValue,
                            },
                          });
                        }}
                      />
                    }
                    label="First Name"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.basicInfoFields.lastName}
                        onChange={(e) => {
                          const newLastNameValue = e.target.checked;
                          const firstNameEnabled =
                            permissionData.basicInfoFields.firstName;

                          setPermissionData({
                            ...permissionData,
                            canEditBasicInfo:
                              newLastNameValue || firstNameEnabled,
                            basicInfoFields: {
                              ...permissionData.basicInfoFields,
                              lastName: newLastNameValue,
                            },
                          });
                        }}
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
                      personalInfoFields: e.target.checked
                        ? permissionData.personalInfoFields
                        : {
                            phone: false,
                            address: false,
                            emergencyContact: false,
                            skills: false,
                          },
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">
                    Personal Information
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow editing of contact, address, and skills fields
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
                        onChange={(e) => {
                          const newPhoneValue = e.target.checked;
                          const otherFieldsEnabled =
                            permissionData.personalInfoFields.address ||
                            permissionData.personalInfoFields
                              .emergencyContact ||
                            permissionData.personalInfoFields.skills;

                          setPermissionData({
                            ...permissionData,
                            canEditPersonalInfo:
                              newPhoneValue || otherFieldsEnabled,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              phone: newPhoneValue,
                            },
                          });
                        }}
                      />
                    }
                    label="Phone Number"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.personalInfoFields.address}
                        onChange={(e) => {
                          const newAddressValue = e.target.checked;
                          const otherFieldsEnabled =
                            permissionData.personalInfoFields.phone ||
                            permissionData.personalInfoFields
                              .emergencyContact ||
                            permissionData.personalInfoFields.skills;

                          setPermissionData({
                            ...permissionData,
                            canEditPersonalInfo:
                              newAddressValue || otherFieldsEnabled,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              address: newAddressValue,
                            },
                          });
                        }}
                      />
                    }
                    label="Address"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          permissionData.personalInfoFields.emergencyContact
                        }
                        onChange={(e) => {
                          const newEmergencyValue = e.target.checked;
                          const otherFieldsEnabled =
                            permissionData.personalInfoFields.phone ||
                            permissionData.personalInfoFields.address ||
                            permissionData.personalInfoFields.skills;

                          setPermissionData({
                            ...permissionData,
                            canEditPersonalInfo:
                              newEmergencyValue || otherFieldsEnabled,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              emergencyContact: newEmergencyValue,
                            },
                          });
                        }}
                      />
                    }
                    label="Emergency Contact"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissionData.personalInfoFields.skills}
                        onChange={(e) => {
                          const newSkillsValue = e.target.checked;
                          const otherFieldsEnabled =
                            permissionData.personalInfoFields.phone ||
                            permissionData.personalInfoFields.address ||
                            permissionData.personalInfoFields.emergencyContact;

                          setPermissionData({
                            ...permissionData,
                            canEditPersonalInfo:
                              newSkillsValue || otherFieldsEnabled,
                            personalInfoFields: {
                              ...permissionData.personalInfoFields,
                              skills: newSkillsValue,
                            },
                          });
                        }}
                      />
                    }
                    label="Skills"
                  />
                </FormGroup>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Project Permissions
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 2, display: "block" }}
            >
              Select projects and permissions for each selected project. The
              employee will only be able to edit the content of projects they
              are assigned to.
            </Typography>
            {projectsLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading projects...
                </Typography>
              </Box>
            ) : employeeProjects.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                This employee has no assigned projects.
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Select Projects:
                </Typography>
                <FormGroup>
                  {employeeProjects.map((project) => (
                    <FormControlLabel
                      key={project._id}
                      control={
                        <Checkbox
                          checked={selectedProjects.includes(project._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedProjects((prev) =>
                              checked
                                ? [...prev, project._id]
                                : prev.filter((id) => id !== project._id)
                            );
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {project.description}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>

                {selectedProjects.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Set Permissions for Selected Projects:
                    </Typography>

                    {selectedProjects.map((projectId) => {
                      const project = employeeProjects.find(
                        (p) => p._id === projectId
                      );
                      const projectPermission =
                        permissionData.projectPermissions.find(
                          (p) => p.projectId === projectId
                        );

                      return (
                        <Paper
                          key={projectId}
                          variant="outlined"
                          sx={{ p: 2, mb: 2, borderRadius: 2 }}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            {project?.name}
                          </Typography>

                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    projectPermission?.canEditMilestone || false
                                  }
                                  onChange={(e) => {
                                    const existingPermissions =
                                      permissionData.projectPermissions || [];
                                    const existingIndex =
                                      existingPermissions.findIndex(
                                        (p) => p.projectId === projectId
                                      );

                                    let newPermissions;
                                    if (existingIndex >= 0) {
                                      // Update existing permission
                                      newPermissions = existingPermissions.map(
                                        (p, index) =>
                                          index === existingIndex
                                            ? {
                                                ...p,
                                                canEditMilestone:
                                                  e.target.checked,
                                              }
                                            : p
                                      );
                                    } else {
                                      // Create new permission entry
                                      newPermissions = [
                                        ...existingPermissions,
                                        {
                                          projectId: projectId,
                                          canEditMilestone: e.target.checked,
                                          canEditSRS: false,
                                          canEditOtherDocs: false,
                                        },
                                      ];
                                    }

                                    setPermissionData({
                                      ...permissionData,
                                      projectPermissions: newPermissions,
                                    });
                                  }}
                                />
                              }
                              label="Full Project Milestones Access"
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    projectPermission?.canEditSRS || false
                                  }
                                  onChange={(e) => {
                                    const existingPermissions =
                                      permissionData.projectPermissions || [];
                                    const existingIndex =
                                      existingPermissions.findIndex(
                                        (p) => p.projectId === projectId
                                      );

                                    let newPermissions;
                                    if (existingIndex >= 0) {
                                      // Update existing permission
                                      newPermissions = existingPermissions.map(
                                        (p, index) =>
                                          index === existingIndex
                                            ? {
                                                ...p,
                                                canEditSRS: e.target.checked,
                                              }
                                            : p
                                      );
                                    } else {
                                      // Create new permission entry
                                      newPermissions = [
                                        ...existingPermissions,
                                        {
                                          projectId: projectId,
                                          canEditMilestone: false,
                                          canEditSRS: e.target.checked,
                                          canEditOtherDocs: false,
                                        },
                                      ];
                                    }

                                    setPermissionData({
                                      ...permissionData,
                                      projectPermissions: newPermissions,
                                    });
                                  }}
                                />
                              }
                              label="Full SRS Documents Access"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    projectPermission?.canEditOtherDocs || false
                                  }
                                  onChange={(e) => {
                                    const existingPermissions =
                                      permissionData.projectPermissions || [];
                                    const existingIndex =
                                      existingPermissions.findIndex(
                                        (p) => p.projectId === projectId
                                      );

                                    let newPermissions;
                                    if (existingIndex >= 0) {
                                      // Update existing permission
                                      newPermissions = existingPermissions.map(
                                        (p, index) =>
                                          index === existingIndex
                                            ? {
                                                ...p,
                                                canEditOtherDocs:
                                                  e.target.checked,
                                              }
                                            : p
                                      );
                                    } else {
                                      // Create new permission entry
                                      newPermissions = [
                                        ...existingPermissions,
                                        {
                                          projectId: projectId,
                                          canEditMilestone: false,
                                          canEditSRS: false,
                                          canEditOtherDocs: e.target.checked,
                                        },
                                      ];
                                    }

                                    setPermissionData({
                                      ...permissionData,
                                      projectPermissions: newPermissions,
                                    });
                                  }}
                                />
                              }
                              label="Full Other Documents Access"
                            />
                          </FormGroup>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
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
            startIcon={
              actionLoading ? <CircularProgress size={16} /> : <CheckIcon />
            }
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
