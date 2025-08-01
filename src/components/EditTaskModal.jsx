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
  Paper,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Flag as PriorityIcon,
  Notes as DescriptionIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CustomSnackbar from "./CustomSnackbar";

const EditTaskModal = ({
  open,
  onClose,
  onSuccess,
  task,
  projects,
  employees,
}) => {
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

      const filteredEmployees = employees.filter((employee) =>
        assignedEmployeeIds.includes(employee._id)
      );

      setAvailableEmployees(filteredEmployees);

      // Clear assignee if currently selected employee is not assigned to the project
      if (
        formData.assignedTo &&
        !assignedEmployeeIds.includes(formData.assignedTo)
      ) {
        setFormData((prev) => ({ ...prev, assignedTo: "" }));
      }
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

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        status: task.status || "Assigned",
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
        projectId: task.projectId?._id || task.projectId || "",
      });
    }
  }, [task]);

  const handleClose = () => {
    if (loading) return;
    setSnackbar({ open: false, message: "", severity: "info" });
    onClose();
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dueDate: date,
    }));
  };

  const handleEmployeeChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: newValue?._id || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar({ open: false, message: "", severity: "info" });

    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      // Validation
      if (!formData.title.trim()) {
        throw new Error("Task title is required");
      }
      if (!formData.assignedTo) {
        throw new Error(
          "Please assign the task to an employee who is assigned to the selected project."
        );
      }
      if (!formData.projectId) {
        throw new Error(
          "Please select a project. Tasks must be assigned to a specific project."
        );
      }

      const response = await fetch(`/api/management/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate?.toISOString(),
          assignedTo: formData.assignedTo,
          projectId: formData.projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const result = await response.json();
      setSnackbar({
        open: true,
        message: "Task updated successfully!",
        severity: "success",
      });
      onSuccess(result.task);
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "70vh" },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TaskIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Edit Task
              </Typography>
            </Box>
            <IconButton onClick={handleClose} disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Tasks can only be assigned to employees
                who are already assigned to the selected project. The employee
                dropdown will only show employees assigned to the selected
                project.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {/* Task Title */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <TaskIcon fontSize="small" color="action" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Task Information
                    </Typography>
                  </Box>
                  <TextField
                    label="Task Title"
                    value={formData.title}
                    onChange={handleChange("title")}
                    fullWidth
                    required
                    disabled={loading}
                    variant="outlined"
                    placeholder="Less than 200 characters"
                  />
                </Paper>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <DescriptionIcon fontSize="small" color="action" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Description
                    </Typography>
                  </Box>
                  <TextField
                    label="Task Description"
                    value={formData.description}
                    onChange={handleChange("description")}
                    sx={{ width: "30vw" }}
                    multiline
                    rows={4}
                    disabled={loading}
                    variant="outlined"
                    placeholder="Provide task description, but cannot exceed 2000 characters"
                  />
                </Paper>
              </Grid>

              {/* Assignment Details */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Assignment Details
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item sx={{ width: "20vw" }} xs={12} md={6}>
                      <Autocomplete
                        options={availableEmployees}
                        getOptionLabel={(option) =>
                          option.firstName && option.lastName
                            ? `${option.firstName} ${option.lastName} (${option.email})`
                            : option.email
                        }
                        value={
                          availableEmployees.find(
                            (emp) => emp._id === formData.assignedTo
                          ) || null
                        }
                        onChange={handleEmployeeChange}
                        disabled={loading || !formData.projectId}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assign to Employee"
                            required
                            variant="outlined"
                            helperText={
                              !formData.projectId
                                ? "Select a project first"
                                : availableEmployees.length === 0
                                ? "No employees assigned to this project"
                                : "Select an employee assigned to this project"
                            }
                          />
                        )}
                        noOptionsText={
                          !formData.projectId
                            ? "Please select a project first"
                            : "No employees assigned to this project"
                        }
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box component="li" key={key} {...otherProps}>
                              <Box>
                                <Typography variant="body2">
                                  {option.firstName && option.lastName
                                    ? `${option.firstName} ${option.lastName}`
                                    : option.email}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option.email}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl
                        sx={{ width: "20vw" }}
                        disabled={loading}
                        required
                      >
                        <InputLabel>Project</InputLabel>
                        <Select
                          value={formData.projectId}
                          onChange={handleChange("projectId")}
                          label="Project"
                        >
                          {projects.map((project) => (
                            <MenuItem key={project._id} value={project._id}>
                              <Box>
                                <Typography variant="body2">
                                  {project.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {project.details}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Task Properties */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <PriorityIcon fontSize="small" color="action" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Task Properties
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth disabled={loading}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={formData.priority}
                          onChange={handleChange("priority")}
                          label="Priority"
                        >
                          <MenuItem value="Low">
                            <Chip
                              label="Low"
                              color="success"
                              size="small"
                              sx={{ mr: 1, pointerEvents: "none" }}
                            />
                            Low Priority
                          </MenuItem>
                          <MenuItem value="Medium">
                            <Chip
                              label="Medium"
                              color="warning"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Medium Priority
                          </MenuItem>
                          <MenuItem value="High">
                            <Chip
                              label="High"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            High Priority
                          </MenuItem>
                          <MenuItem value="Critical">
                            <Chip
                              label="Critical"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Critical Priority
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth disabled={loading}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={formData.status}
                          onChange={handleChange("status")}
                          label="Status"
                        >
                          <MenuItem value="Assigned">
                            <Chip
                              label="Assigned"
                              color="default"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Assigned
                          </MenuItem>
                          <MenuItem value="In Progress">
                            <Chip
                              label="In Progress"
                              color="primary"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            In Progress
                          </MenuItem>
                          <MenuItem value="On Hold">
                            <Chip
                              label="On Hold"
                              color="warning"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            On Hold
                          </MenuItem>
                          <MenuItem value="Under Review">
                            <Chip
                              label="Under Review"
                              color="info"
                              size="small"
                              sx={{ mr: 1, pointerEvents: "none" }}
                            />
                            Under Review
                          </MenuItem>
                          <MenuItem value="Completed">
                            <Chip
                              label="Completed"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Completed
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <DatePicker
                        label="Due Date"
                        value={formData.dueDate}
                        onChange={handleDateChange}
                        disabled={loading}
                        slotProps={{
                          textField: { fullWidth: true, required: true },
                        }}
                        minDate={new Date()}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <EditIcon />
              }
            >
              {loading ? "Updating..." : "Update Task"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </LocalizationProvider>
  );
};

export default EditTaskModal;
