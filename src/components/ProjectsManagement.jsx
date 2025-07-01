"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Modal,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import ProjectManagementDetailsModal from "./ProjectManagementDetailsModal";
import CustomSnackbar from "./CustomSnackbar";
import { getToken } from "../utils/storage";

const ProjectsManagement = ({ user, onBack, onProjectCountChange }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [editingProject, setEditingProject] = useState(null);
  const [isCreateProject, setCreateProject] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [statusConfirmation, setStatusConfirmation] = useState({
    isOpen: false,
    project: null,
  });
  const [showInactive, setShowInactive] = useState(false);
  const [viewFilter, setViewFilter] = useState("active");
  const [assignedFilter, setAssignedFilter] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    details: "",
  });
  // Removed viewMode state - only table view now

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchProjects();
  }, [showInactive]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [viewFilter, assignedFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Only access localStorage after component has mounted
      if (typeof window === "undefined") {
        setSnackbar({
          open: true,
          message: "Browser environment required",
          severity: "error",
        });
        return;
      }

      const token = getToken();
      const url = showInactive
        ? "/api/projects?showInactive=true"
        : "/api/projects";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newProjects = data.projects || [];
        setProjects(newProjects);
        // Notify parent component of the active project count only
        if (onProjectCountChange) {
          const activeProjects = newProjects.filter(
            (p) => p.isActive !== false
          );
          onProjectCountChange(activeProjects.length);
        }
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to fetch projects",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setSnackbar({
        open: true,
        message: "Error fetching projects",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim() || !formData.details.trim()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    try {
      // Only access localStorage after component has mounted
      if (typeof window === "undefined") {
        setSnackbar({
          open: true,
          message: "Browser environment required",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      const token = getToken();
      const url = editingProject
        ? `/api/projects/${editingProject._id}`
        : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          details: formData.details.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: editingProject
            ? "Project updated successfully!"
            : "Project created successfully!",
          severity: "success",
        });
        setFormData({ name: "", details: "" });
        setEditingProject(null);
        fetchProjects(); // Refresh projects list for both new and updated projects
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to save project",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);
      setSnackbar({
        open: true,
        message: "Error saving project",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      details: project.details,
    });
  };

  const handleToggleStatus = (project) => {
    setStatusConfirmation({
      isOpen: true,
      project: project,
    });
  };

  const confirmToggleStatus = async () => {
    if (statusConfirmation.project) {
      setLoading(true);
      try {
        // Only access localStorage after component has mounted
        if (typeof window === "undefined") {
          setSnackbar({
            open: true,
            message: "Browser environment required",
            severity: "error",
          });
          setLoading(false);
          return;
        }

        const token = getToken();
        const response = await fetch(
          `/api/projects/${statusConfirmation.project._id}/toggle-status`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSnackbar({
            open: true,
            message: data.message,
            severity: "success",
          });
          fetchProjects(); // Refresh projects list
        } else {
          const errorData = await response.json();
          setSnackbar({
            open: true,
            message: errorData.error || "Failed to toggle project status",
            severity: "error",
          });
        }
      } catch (error) {
        console.error("Error toggling project status:", error);
        setSnackbar({
          open: true,
          message: "Error toggling project status",
          severity: "error",
        });
      } finally {
        setLoading(false);
        setStatusConfirmation({ isOpen: false, project: null });
      }
    }
  };

  const cancelToggleStatus = () => {
    setStatusConfirmation({ isOpen: false, project: null });
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setFormData({ name: "", details: "" });
  };

  const handleViewFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setViewFilter(newFilter);
      setShowInactive(newFilter === "all" || newFilter === "inactive");
    }
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedProject(null);
    setShowDetailsModal(false);
  };

  // Removed handleViewModeToggle function - only table view now

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    // Apply status filter (active/inactive/all)
    if (viewFilter === "active") {
      filtered = filtered.filter((p) => p.isActive !== false);
    } else if (viewFilter === "inactive") {
      filtered = filtered.filter((p) => p.isActive === false);
    }
    // 'all' shows everything, no additional filtering needed

    // Apply assigned filter if enabled
    if (assignedFilter) {
      filtered = filtered.filter((p) => p.hasAssignments);
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();

  // Get paginated projects
  const paginatedProjects = filteredProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "text.primary" }}
          >
            Projects Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Create/Edit Project Form */}
        <Button
          disabled={editingProject ? true : false}
          variant="contained"
          sx={{
            my: 2,
            "&.Mui-disabled": {
              backgroundColor: "#17a2b8", // Background when disabled
              color: "white", // Text color when disabled
            },
            borderRadius: 2,
          }}
          onClick={() => {
            setCreateProject(!isCreateProject);
          }}
        >
          {editingProject
            ? "Editing..."
            : isCreateProject
            ? "Cancel"
            : "Create New Project"}
        </Button>

        <Modal
          open={editingProject || isCreateProject}
          onClose={() => {
            setCreateProject(false);
            handleCancelEdit();
          }}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            sx={{
              p: 3,
              mb: 3,
              width: 600,
              maxWidth: "95vw",
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h5"
              component="h3"
              sx={{ mb: 3, color: "primary.main" }}
            >
              {editingProject ? "Edit Project" : "Create New Project"}
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Project Name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                required
                placeholder="Enter project name"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                id="details"
                name="details"
                label="Project Details"
                value={formData.details}
                onChange={handleInputChange}
                variant="outlined"
                multiline
                rows={4}
                required
                placeholder="Enter project details and description"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    minWidth: 140,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : editingProject ? (
                    "Update Project"
                  ) : (
                    "Create Project"
                  )}
                </Button>
                {isCreateProject && (
                  <Button
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                    }}
                    onClick={() => {
                      setCreateProject(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {editingProject && (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Modal>

        {/* Projects List */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              pl: 2,
            }}
          >
            <Typography
              variant="h5"
              component="h3"
              sx={{ color: "primary.main" }}
            >
              Projects ({filteredProjects.length})
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Assigned Filter Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={assignedFilter}
                    onChange={(e) => setAssignedFilter(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show only assigned"
                sx={{
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  },
                }}
              />

              {/* Status Filter Toggle Group */}
              <ToggleButtonGroup
                value={viewFilter}
                exclusive
                onChange={handleViewFilterChange}
                aria-label="project filter"
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 500,
                    padding: "6px 12px",
                    marginRight: 0.5,
                    border: "1px solid",
                    borderColor: "grey.300",
                  },
                  "& .MuiToggleButton-root:last-of-type": {
                    marginRight: 0,
                  },
                }}
              >
                <ToggleButton value="all" aria-label="all projects">
                  All
                </ToggleButton>
                <ToggleButton value="active" aria-label="active projects">
                  Open
                </ToggleButton>
                <ToggleButton value="inactive" aria-label="inactive projects">
                  Closed
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          

          {loading && projects.length === 0 ? (
            <Paper sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="text.secondary">
                Loading projects...
              </Typography>
            </Paper>
          ) : filteredProjects.length === 0 ? (
            <Paper sx={{ textAlign: "center", py: 6 }}>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {assignedFilter
                  ? "No assigned projects found."
                  : viewFilter === "active"
                  ? "No active projects found."
                  : viewFilter === "inactive"
                  ? "No inactive projects found."
                  : "No projects created yet."}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assignedFilter
                  ? "No projects have employees assigned yet. Assign employees to projects to see them here."
                  : viewFilter === "active" || viewFilter === "all"
                  ? "Create your first project using the form above."
                  : "Switch to 'Active' or 'All' to see available projects."}
              </Typography>
            </Paper>
          ) : (
            <Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Project Name</strong></TableCell>
                      <TableCell><strong>Details</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Assignments</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell 
                          sx={{ 
                            maxWidth: 200,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {project.details}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.isActive === false ? "Inactive" : "Active"}
                            color={project.isActive === false ? "default" : "success"}
                            size="small"
                            sx={{ fontWeight: 500, pointerEvents: "none" }}
                          />
                        </TableCell>
                        <TableCell>
                          {project.assignmentCount > 0 ? `${project.assignmentCount} assigned` : "None"}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(project)}
                              disabled={loading}
                              size="small"
                              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 500 }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<InfoIcon />}
                              onClick={() => handleViewDetails(project)}
                              disabled={loading}
                              size="small"
                              color="info"
                              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 500 }}
                            >
                              Details
                            </Button>
                            <Button
                              variant="outlined"
                              color={project.isActive === false ? "success" : "warning"}
                              onClick={() => handleToggleStatus(project)}
                              disabled={loading}
                              size="small"
                              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 500 }}
                            >
                              {project.isActive === false ? "Open" : "Close"}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredProjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Projects per page"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
                sx={{
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Status Toggle Confirmation Dialog */}
        <Dialog
          open={statusConfirmation.isOpen}
          onClose={cancelToggleStatus}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            {statusConfirmation.project?.isActive === false ? "Open" : "Close"}{" "}
            Project
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to{" "}
              <strong>
                {statusConfirmation.project?.isActive === false
                  ? "open"
                  : "close"}
              </strong>{" "}
              the project "<strong>{statusConfirmation.project?.name}</strong>"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {statusConfirmation.project?.isActive === false
                ? "This project will become visible and available for assignment to employees."
                : "This project will be hidden from new assignments but existing assignments will remain."}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={cancelToggleStatus}
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleStatus}
              variant="contained"
              color={
                statusConfirmation.project?.isActive === false
                  ? "success"
                  : "warning"
              }
              autoFocus
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {statusConfirmation.project?.isActive === false
                ? "Open"
                : "Close"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Project Details Modal */}
        <ProjectManagementDetailsModal
          project={selectedProject}
          open={showDetailsModal}
          onClose={handleCloseDetailsModal}
          onRefresh={fetchProjects}
        />
      </Container>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default ProjectsManagement;
