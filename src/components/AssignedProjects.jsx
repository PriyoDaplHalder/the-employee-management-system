"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import TimelineIcon from "@mui/icons-material/Timeline";
import ProjectDetailsModal from "./ProjectDetailsModal";
import EmployeeMilestoneModal from "./EmployeeMilestoneModal";
import { getToken } from "../utils/storage";

const AssignedProjects = ({ user, onBack, onProjectCountChange }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMilestoneProject, setSelectedMilestoneProject] = useState(null);

  // Debug user object
  useEffect(() => {
  }, [user]);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError("No authentication token");
        return;
      }

      const response = await fetch("/api/employee/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assigned projects");
      }
      const data = await response.json();
      const newAssignments = data.assignments || [];
      setAssignments(newAssignments);

      // Notify parent component of active project count only
      if (onProjectCountChange) {
        const activeProjectCount = newAssignments.filter(
          (assignment) => assignment.projectId?.isActive !== false
        ).length;
        onProjectCountChange(activeProjectCount);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (assignment) => {
    setSelectedProject(assignment);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  const handleViewMilestones = (assignment) => {
    setSelectedMilestoneProject(assignment);
  };

  const handleCloseMilestoneModal = () => {
    setSelectedMilestoneProject(null);
  };

  if (loading) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "grey.50",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading your projects...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "grey.50", minHeight: "100vh" }}>
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
            My Projects
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ mb: 4, color: "primary.main" }}
        >
          My Assigned Projects ({assignments.length})
        </Typography>

        {assignments.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects assigned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't been assigned any projects yet. Check back later or
              contact your manager.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead sx={{ bgcolor: "primary.main" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Assigned Date</TableCell>
                  {/* <TableCell>Assigned By</TableCell> */}
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Notes</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "white" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
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
                          width: "10vw",
                          color: assignment.projectId?.isActive === false ? "text.secondary" : "text.primary"
                        }}
                      >
                        {assignment.projectId?.name || "Unnamed Project"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          assignment.projectId?.isActive === false
                            ? "Inactive"
                            : "Active"
                        }
                        variant="outlined"
                        size="small"
                        sx = {
                          { pointerEvents: "none" }
                        }
                        color={
                          assignment.projectId?.isActive === false
                            ? "default"
                            : "success"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {assignment.projectId?.details || "No description available"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(assignment.assignedDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </TableCell>
                    {/* <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {assignment.assignedBy?.email || "N/A"}
                      </Typography>
                    </TableCell> */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {assignment.notes || "No notes"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Tooltip title="View Project Details">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(assignment);
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 500,
                            }}
                          >
                            Details
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedProject && (
          <ProjectDetailsModal
            assignment={selectedProject}
            open={!!selectedProject}
            onClose={handleCloseModal}
            user={user}
          />
        )}

        {selectedMilestoneProject && (
          <EmployeeMilestoneModal
            assignment={selectedMilestoneProject}
            open={!!selectedMilestoneProject}
            onClose={handleCloseMilestoneModal}
            user={user}
          />
        )}
      </Container>
    </Box>
  );
};

export default AssignedProjects;
