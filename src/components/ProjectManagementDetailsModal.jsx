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
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import CustomSnackbar from "./CustomSnackbar";
import {
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Info as InfoIcon,
  DocumentScanner as DocumentScannerIcon,
} from "@mui/icons-material";
import TimelineIcon from '@mui/icons-material/Timeline';
import ConfirmationModal from "./ConfirmationModal";
import ProjectRelatedInfoModal from "./ProjectRelatedInfoModal";
import EmployeeAssignmentModal from "./EmployeeAssignmentModal";
import ProjectMilestoneModal from "./ProjectMilestoneModal";
import ProjectSRSDocumentModal from "./ProjectSRSDocumentModal";

const ProjectManagementDetailsModal = ({
  project,
  open,
  onClose,
  onRefresh,
}) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [assigningEmployee, setAssigningEmployee] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [showRelatedInfoModal, setShowRelatedInfoModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showEmployeeAssignModal, setShowEmployeeAssignModal] = useState(false);
  const [showSRSDocumentModal, setShowSRSDocumentModal] = useState(false);

  useEffect(() => {
    if (open && project) {
      fetchProjectAssignments();
    }
  }, [open, project]);

  const fetchProjectAssignments = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch("/api/management/projects/assign", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch project assignments");
      }

      const data = await response.json();
      const allAssignments = data.assignments || [];

      // Filter assignments for this specific project
      const projectAssignments = allAssignments.filter(
        (assignment) => assignment.projectId?._id === project._id
      );

      setAssignments(projectAssignments);
    } catch (err) {
      console.error("Error fetching project assignments:", err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteConfirmation(true);
  };

  const confirmRemoveAssignment = async () => {
    if (!assignmentToDelete) return;

    setActionLoading(true);
    setShowDeleteConfirmation(false);

    try {
      const token = getToken();
      const response = await fetch(
        `/api/management/projects/assign/${assignmentToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Employee removed from project successfully!",
          severity: "success",
        });
        fetchProjectAssignments(); // Refresh assignments
        if (onRefresh) onRefresh(); // Refresh parent data
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to remove assignment",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error removing assignment:", err);
      setSnackbar({
        open: true,
        message: "Error removing assignment",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
      setAssignmentToDelete(null);
    }
  };

  const cancelRemoveAssignment = () => {
    setShowDeleteConfirmation(false);
    setAssignmentToDelete(null);
  };

  const handleRelatedInfoClick = () => {
    setShowRelatedInfoModal(true);
  };

  const handleMilestoneClick = () => {
    setShowMilestoneModal(true);
  };

  const handleAssignEmployee = () => {
    setShowEmployeeAssignModal(true);
  };

  const handleCloseEmployeeAssignModal = () => {
    setShowEmployeeAssignModal(false);
  };

  const handleEmployeeAssignmentSuccess = () => {
    setSuccess("Employee assigned to project successfully!");
    fetchProjectAssignments(); // Refresh assignments
    if (onRefresh) onRefresh(); // Refresh parent data
    setTimeout(() => setSuccess(""), 3000);
    setShowEmployeeAssignModal(false);
  };

  const handleCloseRelatedInfo = () => {
    setShowRelatedInfoModal(false);
  };

  const handleRelatedInfoSuccess = () => {
    setSuccess("Related information updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleCloseMilestone = () => {
    setShowMilestoneModal(false);
  };

  const handleMilestoneSuccess = () => {
    setSuccess("Milestones updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
    setShowMilestoneModal(false);
  };

  const handleSRSDocumentClick = () => {
    setShowSRSDocumentModal(true);
  };

  const handleCloseSRSDocument = () => {
    setShowSRSDocumentModal(false);
  };

  const handleSRSDocumentSuccess = () => {
    setSuccess("SRS document updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
    setShowSRSDocumentModal(false);
  };

  if (!project) return null;

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
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project Details & Assignments
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {success && (
          <Alert
            severity="success"
            sx={{ m: 3, mb: 0 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* Project Information Section */}
        <Box sx={{ p: 3, bgcolor: "grey.50" }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Project Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                    {project.details || "No description available"}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={project.isActive === false ? "Inactive" : "Active"}
                      color={project.isActive === false ? "default" : "success"}
                      size="small"
                      sx={{ fontWeight: 500 }}
                      clickable={false}
                    />
                    <Chip
                      label={`${assignments.length} Assigned`}
                      variant="outlined"
                      size="small"
                      color="primary"
                      clickable={false}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Project Timeline
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Created:</strong>{" "}
                      {new Date(project.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>

                  {project.updatedAt !== project.createdAt && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Updated:</strong>{" "}
                        {new Date(project.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Project Assignments Section */}
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              Assigned Employees ({assignments.length})
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : assignments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "grey.50" }}>
              <PersonIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No employees assigned
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This project has no employees assigned to it yet.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Assigned Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow
                      key={assignment._id}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: "primary.50",
                        },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {assignment.employeeId?.firstName}{" "}
                            {assignment.employeeId?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {assignment.employeeId?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(assignment.assignedDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.assignedBy?.firstName}{" "}
                          {assignment.assignedBy?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.assignedBy?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {assignment.notes ? (
                            <>
                              <NotesIcon fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={assignment.notes}
                              >
                                {assignment.notes}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No notes
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Remove employee from project">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAssignment(assignment)}
                            disabled={actionLoading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Assign a new employee to this project">
              <Button
                variant="contained"
                size="medium"
                onClick={handleAssignEmployee}
                sx={{
                  minWidth: "auto",
                  px: 3,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Assign Employee
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box gap={1} display="flex" alignItems="center">
          <Button
            onClick={handleRelatedInfoClick}
            variant="contained"
            startIcon={<InfoIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Related Info
          </Button>
          <Button
            onClick={handleMilestoneClick}
            variant="contained"
            startIcon={<TimelineIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Project Milestone
          </Button>
          <Button
            onClick={handleSRSDocumentClick}
            variant="contained"
            startIcon={<DocumentScannerIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            SRS Document
          </Button>
        </Box>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={cancelRemoveAssignment}
        onConfirm={confirmRemoveAssignment}
        title="Remove Employee from Project"
        message={
          assignmentToDelete &&
          `Are you sure you want to remove ${assignmentToDelete.employeeId?.firstName} ${assignmentToDelete.employeeId?.lastName} from this project? This action cannot be undone.`
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      {/* Related Info Modal */}
      <ProjectRelatedInfoModal
        project={project}
        open={showRelatedInfoModal}
        onClose={handleCloseRelatedInfo}
        onSuccess={handleRelatedInfoSuccess}
      />

      {/* Employee Assignment Modal */}
      <EmployeeAssignmentModal
        project={project}
        open={showEmployeeAssignModal}
        onClose={handleCloseEmployeeAssignModal}
        onSuccess={handleEmployeeAssignmentSuccess}
      />

      {/* Project Milestone Modal */}
      <ProjectMilestoneModal
        project={project}
        open={showMilestoneModal}
        onClose={handleCloseMilestone}
        onSuccess={handleMilestoneSuccess}
      />

      {/* SRS Document Modal */}
      <ProjectSRSDocumentModal
        project={project}
        open={showSRSDocumentModal}
        onClose={handleCloseSRSDocument}
        onSuccess={handleSRSDocumentSuccess}
        user={{ role: "management" }}
      />

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Dialog>
  );
};

export default ProjectManagementDetailsModal;
