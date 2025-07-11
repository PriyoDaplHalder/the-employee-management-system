"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

const TaskAssignmentModal = ({
  open,
  onClose,
  onAssign,
  project,
  taskItem,
  milestone,
  feature,
}) => {
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && project) {
      fetchAssignedEmployees();
    }
  }, [open, project]);

  useEffect(() => {
    if (taskItem) {
      setSelectedEmployee(taskItem.assignedTo || "");
      setDueDate(taskItem.dueDate ? new Date(taskItem.dueDate) : null);
    }
  }, [taskItem]);

  const fetchAssignedEmployees = async () => {
    setFetchingEmployees(true);
    setError("");
    try {
      const token = getToken();
      const response = await fetch("/api/management/projects/assign", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assigned employees");
      }

      const data = await response.json();

      // Filter assignments for the current project
      const projectAssignments =
        data.assignments?.filter(
          (assignment) =>
            assignment.projectId?._id === project._id ||
            assignment.projectId === project._id
        ) || [];

      setAssignedEmployees(projectAssignments);
    } catch (err) {
      console.error("Error fetching assigned employees:", err);
      setError(err.message);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !dueDate) {
      setError("Please select an employee and due date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const assignmentData = {
        assignedTo: selectedEmployee,
        dueDate: dueDate.toISOString(),
        assignedAt: new Date().toISOString(),
      };

      await onAssign(milestone.id, feature.id, taskItem.id, assignmentData);
      handleClose();
    } catch (err) {
      console.error("Error assigning task:", err);
      setError(err.message || "Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    setError("");

    try {
      const assignmentData = {
        assignedTo: null,
        dueDate: null,
        assignedAt: null,
      };

      await onAssign(milestone.id, feature.id, taskItem.id, assignmentData);
      handleClose();
    } catch (err) {
      console.error("Error unassigning task:", err);
      setError(err.message || "Failed to unassign task");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee("");
    setDueDate(null);
    setError("");
    onClose();
  };

  const isCurrentlyAssigned = taskItem?.assignedTo;
  const assignedEmployeeName = isCurrentlyAssigned
    ? assignedEmployees.find(
        (emp) => emp.employeeId?._id === taskItem.assignedTo
      )?.employeeId?.firstName +
      " " +
      assignedEmployees.find(
        (emp) => emp.employeeId?._id === taskItem.assignedTo
      )?.employeeId?.lastName
    : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AssignmentIcon color="primary" />
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {isCurrentlyAssigned ? "Update Task Assignment" : "Assign Task"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {taskItem?.text || "Untitled Task"}
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={handleClose}
            size="small"
            sx={{ minWidth: "auto", p: 1 }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Current Assignment Status */}
          {isCurrentlyAssigned && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "primary.50", borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Currently Assigned To:
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {assignedEmployeeName || "Unknown Employee"}
                </Typography>
              </Box>
              {taskItem.dueDate && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Due: {new Date(taskItem.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {fetchingEmployees ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading assigned employees...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ spacing: 3 }}>
              {/* Employee Selection */}
              <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
                <InputLabel>Assign to Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  label="Assign to Employee"
                  disabled={loading}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select an employee</em>
                  </MenuItem>
                  {assignedEmployees.map((assignment) => (
                    <MenuItem
                      key={assignment.employeeId?._id}
                      value={assignment.employeeId?._id}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box>
                          <Typography variant="body2">
                            {assignment.employeeId?.firstName}{" "}
                            {assignment.employeeId?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.employeeId?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Due Date Selection */}
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(date) => setDueDate(date)}
                disabled={loading}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                  },
                  popper: {
                    modifiers: [
                      {
                        name: "offset",
                        options: {
                          offset: [0, 0], 
                        },
                      },
                    ],
                    sx: {
                      top: "50% !important",
                      left: "50% !important",
                      transform: "translate(-50%, -50%) !important",
                      position: "fixed !important",
                      zIndex: 1300,
                    },
                  },
                }}
              />

              {assignedEmployees.length === 0 && !fetchingEmployees && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  No employees are assigned to this project. Please assign
                  employees to the project first.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
            {isCurrentlyAssigned && (
              <Button
                onClick={handleUnassign}
                variant="outlined"
                color="error"
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                Unassign
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              variant="contained"
              disabled={loading || !selectedEmployee || !dueDate}
              startIcon={
                loading ? <CircularProgress size={16} /> : <AssignmentIcon />
              }
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
              }}
            >
              {loading
                ? "Assigning..."
                : isCurrentlyAssigned
                ? "Update"
                : "Assign"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskAssignmentModal;
