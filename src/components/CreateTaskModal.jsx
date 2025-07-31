"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CustomSnackbar from "./CustomSnackbar";

const CreateTaskModal = ({ open, onClose, onSuccess, projects, employees }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Assigned",
    dueDate: null,
    assignedTo: "",
    projectId: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [projectAssignments, setProjectAssignments] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // Fetch project assignments when modal opens
  useEffect(() => {
    if (open) {
      fetchProjectAssignments();
    }
  }, [open]);

  // Update available employees when project is selected
  useEffect(() => {
    if (formData.projectId && projectAssignments.length > 0) {
      const assignedEmployeeIds = projectAssignments
        .filter(
          (assignment) => assignment.projectId?._id === formData.projectId
        )
        .map((assignment) => assignment.employeeId?._id);

      // Only include active employees
      const filteredEmployees = employees.filter(
        (employee) =>
          assignedEmployeeIds.includes(employee._id) && employee.isActive
      );

      setAvailableEmployees(filteredEmployees);

      // Clear assignee if currently selected employee is not assigned to the project or is inactive
      if (
        formData.assignedTo &&
        (!assignedEmployeeIds.includes(formData.assignedTo) ||
          !employees.find(
            (emp) => emp._id === formData.assignedTo && emp.isActive
          ))
      ) {
        setFormData((prev) => ({ ...prev, assignedTo: "" }));
      }
    } else if (formData.projectId === "") {
      // If no project is selected, all employees are available
      setAvailableEmployees(employees.filter((emp) => emp.isActive));
    } else {
      setAvailableEmployees([]);
    }
  }, [formData.projectId, projectAssignments, employees, formData.assignedTo]);

  const fetchProjectAssignments = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/management/projects/assign", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjectAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error("Error fetching project assignments:", err);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData({
      title: "",
      description: "",
      priority: "Medium",
      status: "Assigned",
      dueDate: null,
      assignedTo: "",
      projectId: "",
    });
    setSnackbar({ open: false, message: "", severity: "info" });
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setSnackbar({
        open: true,
        message: "Task title is required",
        severity: "error",
      });
      return;
    }

    if (!formData.projectId) {
      setSnackbar({
        open: true,
        message:
          "Please select a project. Tasks must be assigned to a specific project.",
        severity: "error",
      });
      return;
    }

    // New check: prevent submission if no employees assigned to project
    if (formData.projectId && availableEmployees.length === 0) {
      setSnackbar({
        open: true,
        message:
          "No employees are assigned to this project. Please assign employees to the project before creating a task.",
        severity: "error",
      });
      return;
    }

    if (!formData.assignedTo) {
      setSnackbar({
        open: true,
        message:
          "Please assign the task to an employee who is assigned to the selected project.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    setSnackbar({ open: false, message: "", severity: "info" });

    try {
      const token = getToken();
      // Log the request payload for debugging
      console.log("Submitting task payload:", {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate
          ? (() => {
              const date = new Date(formData.dueDate);
              date.setHours(23, 59, 59, 999);
              return date.toISOString();
            })()
          : undefined,
        assignedTo: formData.assignedTo,
        projectId: formData.projectId || undefined,
      });
      const response = await fetch("/api/management/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate
            ? (() => {
                const date = new Date(formData.dueDate);
                date.setHours(23, 59, 59, 999);
                return date.toISOString();
              })()
            : undefined,
          assignedTo: formData.assignedTo,
          projectId: formData.projectId || undefined,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonErr) {
          errorData = { message: response.statusText };
        }
        // Log the full error response for debugging
        console.error("Task creation API error:", errorData);
        throw new Error(
          errorData.message || errorData.error || "Failed to create task"
        );
      }

      const result = await response.json();
      setSnackbar({
        open: true,
        message: "Task created successfully!",
        severity: "success",
      });
      onSuccess(result.task);
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      console.error("Error creating task:", err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Tasks can only be assigned to employees who
            are already assigned to the selected project. Please ensure the
            employee is assigned to the project before creating the task.
          </Typography>
        </Alert>

        {/* Warning Alert for no employees assigned to project */}
        {formData.projectId && availableEmployees.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No employees are assigned to this project. Please assign employees to
            the project before creating a task.
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title *"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter a clear, descriptive title for the task"
              disabled={loading}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Provide detailed instructions, requirements, or context for this task"
              disabled={loading}
            />
          </Grid>

          {/* Project - Required and moved before assignee */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={{ width: "10vw" }} disabled={loading}>
              <InputLabel>Project *</InputLabel>
              <Select
                value={formData.projectId}
                onChange={(e) => handleChange("projectId", e.target.value)}
                label="Project *"
                required
              >
                <MenuItem value="">
                  <em>Select a Project</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    <Box>
                      <Typography variant="body2">{project.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.details?.substring(0, 50)}
                        {project.details?.length > 50 ? "..." : ""}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Assignee */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={{ width: "10vw" }} disabled={loading}>
              <InputLabel>Assign To *</InputLabel>
              <Select
                value={formData.assignedTo}
                onChange={(e) => handleChange("assignedTo", e.target.value)}
                label="Assign To *"
              >
                {formData.projectId && availableEmployees.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No employees assigned to this project
                    </Typography>
                  </MenuItem>
                ) : !formData.projectId ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      Please select a project first
                    </Typography>
                  </MenuItem>
                ) : (
                  availableEmployees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      <Box>
                        <Typography variant="body2">
                          {employee.email}
                        </Typography>
                        {employee.firstName && employee.lastName && (
                          <Typography variant="caption" color="text.secondary">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Priority */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                label="Priority"
              >
                <MenuItem value="Low">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label="Low" color="success" size="small" />
                    <Typography variant="body2">Low Priority</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Medium">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label="Medium" color="warning" size="small" />
                    <Typography variant="body2">Medium Priority</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="High">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label="High" color="error" size="small" />
                    <Typography variant="body2">High Priority</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Critical">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label="Critical" color="error" size="small" sx={{ pointerEvents: 'none' }} />
                    <Typography variant="body2">Critical Priority</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Initial Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                label="Initial Status"
              >
                <MenuItem value="Assigned">Assigned</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Due Date */}
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date (Optional)"
                value={formData.dueDate}
                onChange={(date) => handleChange("dueDate", date)}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: "Select a deadline for this task",
                  },
                }}
                minDate={new Date()}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading ||
            !formData.title.trim() ||
            !formData.projectId ||
            !formData.assignedTo
          }
        >
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              Creating...
            </Box>
          ) : (
            "Create Task"
          )}
        </Button>
      </DialogActions>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Dialog>
  );
};

export default CreateTaskModal;
