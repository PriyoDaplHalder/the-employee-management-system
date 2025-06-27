"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

const EmployeeAssignmentModal = ({ project, open, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchProjectAssignments();
      // Reset form
      setSelectedEmployee("");
      setNotes("");
      setError("");
    }
  }, [open, project?._id]);

  const fetchEmployees = async () => {
    setFetchingEmployees(true);
    try {
      const token = getToken();
      const response = await fetch("/api/management/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      // Filter to only include active employees
      const activeEmployees = data.filter(user => 
        user.role === "employee" && user.isActive !== false
      );
      setEmployees(activeEmployees);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const fetchProjectAssignments = async () => {
    if (!project?._id) return;

    try {
      const token = getToken();
      const response = await fetch("/api/management/projects/assign", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();
      const assignments = data.assignments || [];

      // Get employee IDs already assigned to this project
      const assignedEmployeeIds = assignments
        .filter((assignment) => assignment.projectId?._id === project._id)
        .map((assignment) => assignment.employeeId?._id);

      // Filter out already assigned employees
      const filtered = employees.filter(
        (employee) => !assignedEmployeeIds.includes(employee._id)
      );

      setAvailableEmployees(filtered);
    } catch (err) {
      console.error("Error fetching project assignments:", err);
      // If fetching assignments fails, show all employees
      setAvailableEmployees(employees);
    }
  };

  // Update available employees when employees or project changes
  useEffect(() => {
    if (employees.length > 0 && project?._id) {
      fetchProjectAssignments();
    }
  }, [employees, project?._id]);

  const handleAssign = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();
      const response = await fetch("/api/management/projects/assign", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project._id,
          employeeId: selectedEmployee,
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign employee");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployeeData = availableEmployees.find(
    (e) => e._id === selectedEmployee
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Assign Employee to Project
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Project Details
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project?.name || "Project name not available"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {project?.details || "No description available"}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Employee</InputLabel>
          <Select
            value={selectedEmployee}
            label="Select Employee"
            onChange={(e) => setSelectedEmployee(e.target.value)}
            disabled={fetchingEmployees}
          >
            {fetchingEmployees ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading employees...
              </MenuItem>
            ) : availableEmployees.length === 0 ? (
              <MenuItem disabled>
                {employees.length === 0
                  ? "No employees available"
                  : "All employees already assigned to this project"}
              </MenuItem>
            ) : (
              availableEmployees.map((employee) => (
                <MenuItem key={employee._id} value={employee._id}>
                  <Box>
                    <Typography variant="body2">
                      {employee.firstName && employee.lastName
                        ? `${employee.firstName} ${employee.lastName}`
                        : "Name not provided"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {employee.email}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {selectedEmployeeData && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Employee Details
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              {selectedEmployeeData.firstName && selectedEmployeeData.lastName
                ? `${selectedEmployeeData.firstName} ${selectedEmployeeData.lastName}`
                : "Name not provided"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {selectedEmployeeData.email}
            </Typography>
            {selectedEmployeeData.employeeData?.department && (
              <Typography variant="caption" color="text.secondary">
                Department: {selectedEmployeeData.employeeData.department}
              </Typography>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Assignment Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any specific instructions or notes for this assignment..."
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || !selectedEmployee || fetchingEmployees}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Assigning...
            </>
          ) : (
            "Assign Employee"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeAssignmentModal;
