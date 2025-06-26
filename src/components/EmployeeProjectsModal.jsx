"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  TableSortLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getToken } from "../utils/storage";

const EmployeeProjectsModal = ({ employee, open, onClose }) => {
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "assignedDate",
    direction: "desc",
  });

  // Fetch assigned projects when modal opens
  useEffect(() => {
    if (open && employee?._id) {
      fetchAssignedProjects();
    }
  }, [open, employee?._id]);

  // Helper function to get sortable value from assignment object
  const getSortValue = (assignment, key) => {
    switch (key) {
      case "projectName":
        return assignment.projectId?.name?.toLowerCase() || "zzz";
      case "status":
        return assignment.projectId?.isActive === false ? "inactive" : "active";
      case "description":
        return assignment.projectId?.details?.toLowerCase() || "zzz";
      case "assignedDate":
        return new Date(assignment.assignedDate).getTime();
      case "assignedBy":
        const assignedBy = assignment.assignedBy;
        if (assignedBy?.firstName && assignedBy?.lastName) {
          return `${assignedBy.firstName} ${assignedBy.lastName}`.toLowerCase();
        }
        return assignedBy?.email?.toLowerCase() || "zzz";
      case "notes":
        return assignment.notes?.toLowerCase() || "zzz";
      default:
        return "";
    }
  };

  // Handle sort click
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      // If clicking the same column, toggle direction
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    // If clicking a different column, always start with ascending
    setSortConfig({ key, direction });
  };

  // Sort projects based on current sort configuration
  const sortedProjects = [...assignedProjects].sort((a, b) => {
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);

    // Handle numeric comparison (dates)
    if (sortConfig.key === "assignedDate") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle string comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        : bValue.localeCompare(aValue, undefined, {
            numeric: true,
            sensitivity: "base",
          });
    }

    // Fallback comparison
    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const fetchAssignedProjects = async () => {
    setLoading(true);
    setError("");
    
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Projects Assigned to {employee.firstName && employee.lastName 
              ? `${employee.firstName} ${employee.lastName}` 
              : "Employee"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {employee.email}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : assignedProjects.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: "grey.50",
              borderStyle: "dashed",
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Projects Assigned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This employee has not been assigned to any projects yet.
            </Typography>
          </Paper>
        ) : (
          <Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "projectName"}
                        direction={sortConfig.key === "projectName" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("projectName")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Project Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "status"}
                        direction={sortConfig.key === "status" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("status")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "description"}
                        direction={sortConfig.key === "description" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("description")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Description
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "assignedDate"}
                        direction={sortConfig.key === "assignedDate" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("assignedDate")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Assigned Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "assignedBy"}
                        direction={sortConfig.key === "assignedBy" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("assignedBy")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Assigned By
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "notes"}
                        direction={sortConfig.key === "notes" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("notes")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Notes
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedProjects.map((assignment, index) => (
                    <TableRow
                      key={assignment._id}
                      sx={{
                        backgroundColor: assignment.projectId?.isActive === false ? "grey.50" : index % 2 === 0 ? "grey.50" : "white",
                        "&:hover": {
                          backgroundColor: assignment.projectId?.isActive === false ? "grey.100" : "primary.50",
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
                          variant="outlined"
                          sx={{ pointerEvents: "none" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {assignment.projectId?.details || "No description available"}
                        </Typography>
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
                            maxWidth: 200,
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
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: 100,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeProjectsModal;
