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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
} from "@mui/material";
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  RateReview as ReviewIcon,
  Assignment as TaskIcon,
} from "@mui/icons-material";
import TaskDetailModal from "./TaskDetailModal";
import { getToken } from "../utils/storage";

const EmployeeProjectTasksModal = ({ employee, project, open, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Modal states
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch tasks when modal opens
  useEffect(() => {
    if (open && employee?._id && project?._id) {
      fetchProjectTasks();
    }
  }, [open, employee?._id, project?._id]);

  // Helper function to get sortable value from task object
  const getSortValue = (task, key) => {
    switch (key) {
      case "title":
        return task.title?.toLowerCase() || "zzz";
      case "status":
        return task.status?.toLowerCase() || "zzz";
      case "priority":
        const priorityOrder = { "low": 1, "medium": 2, "high": 3, "critical": 4 };
        return priorityOrder[task.priority?.toLowerCase()] || 0;
      case "dueDate":
        return task.dueDate ? new Date(task.dueDate).getTime() : 0;
      case "createdAt":
        return new Date(task.createdAt).getTime();
      default:
        return "";
    }
  };

  // Handle sort click
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  // Sort tasks based on current sort configuration
  const sortedTasks = [...tasks].sort((a, b) => {
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);

    // Handle numeric comparison (dates and priority)
    if (sortConfig.key === "dueDate" || sortConfig.key === "createdAt" || sortConfig.key === "priority") {
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

  const fetchProjectTasks = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = getToken();
      const response = await fetch(
        `/api/management/employee/${employee._id}/tasks?projectId=${project._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch project tasks");
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Error fetching project tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    switch (priority?.toLowerCase()) {
      case "low": return "success";
      case "medium": return "warning";
      case "high": return "error";
      case "critical": return "error";
      default: return "default";
    }
  };

  // Helper function to check if task is overdue
  const isTaskOverdue = (dueDate, status) => {
    if (!dueDate || status === "Completed") return false;
    return new Date(dueDate) < new Date();
  };

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    return true;
  });

  // Apply sorting to filtered tasks
  const filteredAndSortedTasks = [...filteredTasks].sort((a, b) => {
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);

    // Handle numeric comparison (dates and priority)
    if (sortConfig.key === "dueDate" || sortConfig.key === "createdAt" || sortConfig.key === "priority") {
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

  // Handle menu actions
  const handleMenuOpen = (event, task) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTask(null);
  };

  const handleMenuAction = (action) => {
    if (!selectedTask) return;
    
    switch (action) {
      case "view":
        handleTaskView(selectedTask);
        break;
      case "delete":
        handleTaskDelete(selectedTask._id);
        break;
      default:
        break;
    }
    
    handleMenuClose();
  };

  const handleTaskView = async (task) => {
    setSelectedTask(task);
    setShowTaskDetailModal(true);
    
    // Fetch detailed task information including activity history
    try {
      const token = getToken();
      const response = await fetch(`/api/management/tasks/${task._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const detailedTask = await response.json();
        setSelectedTask(detailedTask.task);
      }
    } catch (err) {
      console.error("Error fetching task details:", err);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    
    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/management/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete task");
      
      setTasks(prev => prev.filter(task => task._id !== taskId));
      setSuccess("Task deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus, comment = "") => {
    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/management/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask.task : task
      ));
      
      // Also refresh the selected task if it's being viewed
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(updatedTask.task);
      }
      
      setSuccess("Task updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!employee || !project) return null;

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
            Tasks for {employee.firstName && employee.lastName 
              ? `${employee.firstName} ${employee.lastName}` 
              : "Employee"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project: {project.name} • {employee.email}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
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
              No Tasks Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This employee has no tasks assigned for the project "{project.name}".
            </Typography>
          </Paper>
        ) : (
          <Box>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Filters</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="Assigned">Assigned</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                      <MenuItem value="Under Review">Under Review</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      label="Priority"
                    >
                      <MenuItem value="all">All Priority</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "title"}
                        direction={sortConfig.key === "title" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("title")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Task Title
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
                        active={sortConfig.key === "priority"}
                        direction={sortConfig.key === "priority" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("priority")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Priority
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "dueDate"}
                        direction={sortConfig.key === "dueDate" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("dueDate")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Due Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "createdAt"}
                        direction={sortConfig.key === "createdAt" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("createdAt")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        Created
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedTasks.map((task, index) => (
                    <TableRow
                      key={task._id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "grey.50" : "white",
                        "&:hover": {
                          backgroundColor: "primary.50",
                        },
                      }}
                    >
                      <TableCell>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              display: "block",
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
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
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          color={getPriorityColor(task.priority)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <Typography 
                            variant="body2"
                            color={isTaskOverdue(task.dueDate, task.status) ? "error.main" : "text.primary"}
                            sx={{ 
                              fontWeight: isTaskOverdue(task.dueDate, task.status) ? 600 : 400 
                            }}
                          >
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {isTaskOverdue(task.dueDate, task.status) && (
                              <Typography component="span" variant="caption" color="error.main" sx={{ display: "block" }}>
                                Overdue
                              </Typography>
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                            No due date
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(task.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="More actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, task)}
                            disabled={actionLoading}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Actions Menu */}
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem onClick={() => handleMenuAction("view")}>
                <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
                View Details
              </MenuItem>
              <MenuItem 
                onClick={() => handleMenuAction("delete")}
                sx={{ color: "error.main" }}
              >
                <EditIcon sx={{ mr: 1 }} fontSize="small" />
                Delete Task
              </MenuItem>
            </Menu>
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={showTaskDetailModal}
        onClose={() => {
          setSelectedTask(null);
          setShowTaskDetailModal(false);
        }}
        onStatusUpdate={handleTaskStatusUpdate}
        onDelete={() => {
          handleTaskDelete(selectedTask._id);
          setSelectedTask(null);
          setShowTaskDetailModal(false);
        }}
        loading={actionLoading}
        projects={[project]}
        employees={[employee]}
      />
    </Dialog>
  );
};

export default EmployeeProjectTasksModal;
