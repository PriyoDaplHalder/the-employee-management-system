"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Grid,
  Box,
  Chip,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ManagementEmployeeEdit from "./ManagementEmployeeEdit";
import { getToken } from "../utils/storage";

const EmployeeDetailsModal = ({ employee, user, onClose, onEmployeeUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(employee);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [tasksError, setTasksError] = useState("");
  const employeeData = currentEmployee.employeeData || currentEmployee;
  const isManagement = user?.role === "management";

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
  };

  const handleSaveEdit = (updatedEmployee) => {
    // Update the current employee with the new data
    setCurrentEmployee(updatedEmployee);
    setShowEditModal(false);

    // Trigger refresh in the parent component
    if (onEmployeeUpdate) {
      onEmployeeUpdate();
    }
  };

  // Fetch assigned projects
  const fetchAssignedProjects = async () => {
    if (!isManagement || !employee._id) return;

    setProjectsLoading(true);
    setProjectsError("");
    
    try {
      const token = getToken();
      const response = await fetch(`/api/management/employee/${employee._id}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assigned projects");
      }

      const data = await response.json();
      setAssignedProjects(data.assignments || []);
    } catch (err) {
      console.error("Error fetching assigned projects:", err);
      setProjectsError(err.message);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch assigned tasks
  const fetchAssignedTasks = async () => {
    if (!isManagement || !employee._id) return;

    setTasksLoading(true);
    setTasksError("");
    
    try {
      const token = getToken();
      const response = await fetch(`/api/management/employee/${employee._id}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assigned tasks");
      }

      const data = await response.json();
      setAssignedTasks(data.tasks || []);
      setTaskStats(data.stats || {});
    } catch (err) {
      console.error("Error fetching assigned tasks:", err);
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  };

  // Fetch data when component mounts or employee changes
  useEffect(() => {
    if (isManagement && employee._id) {
      fetchAssignedProjects();
      fetchAssignedTasks();
    }
  }, [isManagement, employee._id]);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned": return "default";
      case "In Progress": return "primary";
      case "On Hold": return "warning";
      case "Under Review": return "info";
      case "Completed": return "success";
      default: return "default";
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low": return "success";
      case "Medium": return "warning";
      case "High": return "error";
      case "Critical": return "error";
      default: return "default";
    }
  };
  if (showEditModal) {
    return (
      <ManagementEmployeeEdit
        employee={currentEmployee}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />
    );
  }
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "95vh",
          m: 1,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 3,
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Employee Profile
          </Typography>
          <Chip
            label={employeeData.employeeId || "N/A"}
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: 500,
            }}
          />
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              transform: "scale(1.1)",
            },
            transition: "all 0.2s",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>{" "}
      <DialogContent sx={{ p: 0, bgcolor: "grey.50" }}>
        <Box sx={{ py: 4, px: 3 }}>
          <Grid container spacing={4}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Basic Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Employee ID
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.employeeId || "Not assigned"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Email Address
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employee.email ||
                            employeeData.user?.email ||
                            "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        First Name
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employee.firstName ||
                            employeeData.user?.firstName ||
                            "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Last Name
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employee.lastName ||
                            employeeData.user?.lastName ||
                            "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>{" "}
            {/* Work Information Section */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Work Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Department
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.department || "Not assigned"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Position
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.position || "Not assigned"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Salary (INR)
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            color: "text.primary",
                          }}
                        >
                          {employeeData.salary
                            ? `₹${employeeData.salary.toLocaleString()}`
                            : "Not disclosed"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Hire Date
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.hireDate
                            ? new Date(
                                employeeData.hireDate
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>{" "}
            
            {/* Account Status Section */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Account Status
                </Typography>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: (() => {
                      const isActive =
                        employee.isActive !== undefined
                          ? employee.isActive
                          : employeeData.isActive;
                      return isActive ? "success.50" : "error.50";
                    })(),
                    border: "1px solid",
                    borderColor: (() => {
                      const isActive =
                        employee.isActive !== undefined
                          ? employee.isActive
                          : employeeData.isActive;
                      return isActive ? "success.200" : "error.200";
                    })(),
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Current Status:
                    </Typography>
                    <Chip
                      label={
                        (
                          employee.isActive !== undefined
                            ? employee.isActive
                            : employeeData.isActive
                        )
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        (
                          employee.isActive !== undefined
                            ? employee.isActive
                            : employeeData.isActive
                        )
                          ? "success"
                          : "error"
                      }
                      variant="filled"
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontStyle: "italic", mt: 1 }}
                  >
                    {(
                      employee.isActive !== undefined
                        ? employee.isActive
                        : employeeData.isActive
                    )
                      ? "Employee has access to the system"
                      : "Employee access is restricted"}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Personal Information Section */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Personal Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Phone Number
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.personalInfo?.phone || "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Emergency Contact
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.personalInfo?.emergencyContact?.phone ||
                            "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Address
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employeeData.personalInfo?.address?.street ||
                            "Not provided"}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        Skills & Expertise
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        {employeeData.skills &&
                        employeeData.skills.length > 0 ? (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                          >
                            {employeeData.skills.map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                sx={{
                                  bgcolor: "primary.50",
                                  color: "primary.main",
                                  border: "1px solid",
                                  borderColor: "primary.200",
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  "&:hover": {
                                    bgcolor: "primary.100",
                                  },
                                }}
                                size="medium"
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography
                            variant="body1"
                            sx={{
                              color: "text.secondary",
                              fontStyle: "italic",
                            }}
                          >
                            No skills listed
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>{" "}

            {/* Assigned Projects Section (Management only) */}
            {isManagement && (
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    Assigned Projects ({assignedProjects.length})
                  </Typography>

                  {projectsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : projectsError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {projectsError}
                    </Alert>
                  ) : assignedProjects.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "grey.50",
                        borderStyle: "dashed",
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        No projects assigned to this employee
                      </Typography>
                    </Paper>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.50" }}>
                            <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assigned Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assignedProjects.map((assignment) => (
                            <TableRow
                              key={assignment._id}
                              sx={{
                                backgroundColor: assignment.projectId?.isActive === false ? "grey.50" : "inherit",
                                "&:hover": {
                                  backgroundColor: assignment.projectId?.isActive === false ? "grey.100" : "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: assignment.projectId?.isActive === false ? "text.secondary" : "text.primary"
                                  }}
                                >
                                  {assignment.projectId?.name || "Unknown Project"}
                                </Typography>
                                {assignment.projectId?.details && (
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: "block",
                                      maxWidth: 200,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {assignment.projectId.details}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={assignment.projectId?.isActive === false ? "Inactive" : "Active"}
                                  color={assignment.projectId?.isActive === false ? "default" : "success"}
                                  size="small"
                                  sx={{ pointerEvents: "none" }}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(assignment.assignedDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {assignment.assignedBy?.firstName && assignment.assignedBy?.lastName
                                    ? `${assignment.assignedBy.firstName} ${assignment.assignedBy.lastName}`
                                    : assignment.assignedBy?.email || "Unknown"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  color={assignment.notes ? "text.primary" : "text.secondary"}
                                  sx={{
                                    maxWidth: 150,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontStyle: assignment.notes ? "normal" : "italic",
                                  }}
                                >
                                  {assignment.notes || "No notes"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Assigned Tasks Section (Management only) */}
            {isManagement && (
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    Assigned Tasks ({assignedTasks.length})
                  </Typography>

                  {/* Task Statistics */}
                  {Object.keys(taskStats).length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "primary.50" }}>
                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                              {taskStats.total || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Tasks
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "success.50" }}>
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                              {taskStats.completed || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Completed
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "info.50" }}>
                            <Typography variant="h6" color="info.main" sx={{ fontWeight: 600 }}>
                              {taskStats.inProgress || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              In Progress
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "error.50" }}>
                            <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                              {taskStats.overdue || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Overdue
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {tasksLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : tasksError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {tasksError}
                    </Alert>
                  ) : assignedTasks.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "grey.50",
                        borderStyle: "dashed",
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        No tasks assigned to this employee
                      </Typography>
                    </Paper>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.50" }}>
                            <TableCell sx={{ fontWeight: 600 }}>Task Title</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assignedTasks.map((task) => (
                            <TableRow
                              key={task._id}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {task.title}
                                </Typography>
                                {task.description && (
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      maxWidth: 200,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      pointerEvents: "none",
                                    }}
                                  >
                                    {task.description}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={task.status}
                                  color={getStatusColor(task.status)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ pointerEvents: "none" }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={task.priority}
                                  color={getPriorityColor(task.priority)}
                                  size="small"
                                  variant="filled"
                                  sx={{ pointerEvents: "none" }}
                                />
                              </TableCell>
                              <TableCell>
                                {task.dueDate ? (
                                  <Tooltip title={new Date(task.dueDate).toLocaleDateString()}>
                                    <Typography 
                                      variant="body2"
                                      color={
                                        new Date(task.dueDate) < new Date() && task.status !== "Completed"
                                          ? "error.main" 
                                          : "text.primary"
                                      }
                                      sx={{ 
                                        fontWeight: new Date(task.dueDate) < new Date() && task.status !== "Completed" ? 600 : 400 
                                      }}
                                    >
                                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                    No due date
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {task.projectId?.name || "No project"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>{" "}
      <DialogActions
        sx={{
          p: 3,
          bgcolor: "white",
          gap: 2,
          borderTop: "1px solid",
          borderColor: "grey.200",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isManagement ? "Management View" : "Employee View"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          {isManagement && (
            <Button
              onClick={handleEditClick}
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{
                minWidth: 120,
                borderRadius: 2,
                fontWeight: 500,
                textTransform: "none",
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "primary.50",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              Edit Details
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              minWidth: 100,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s",
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDetailsModal;
