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
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Topic as TopicIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";
import AddIcon from "@mui/icons-material/Add";
import ConfirmationModal from "./ConfirmationModal";
import TaskAssignmentModal from "./TaskAssignmentModal";
import EmployeeMilestoneList from "./EmployeeMilestoneList";
import EmployeeNotesList from "./EmployeeNotesList";

const EmployeeMilestoneModal = ({ assignment, open, onClose, user }) => {
  const [milestones, setMilestones] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [expandedFeature, setExpandedFeature] = useState({});
  const [expandedNote, setExpandedNote] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [originalMilestone, setOriginalMilestone] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState({
    open: false,
    taskItem: null,
    milestone: null,
    feature: null,
  });

  // Extract project from assignment, ensuring we have a proper project object or ID
  const project = assignment?.projectId;

  // For debugging
  useEffect(() => {
    if (project) {
      console.log("Project data:", {
        project,
        type: typeof project,
        hasId: !!project._id,
        id: project._id || project,
      });
    }
  }, [project]);

  useEffect(() => {
    if (open && project) {
      fetchMilestones();
    }
  }, [open, project]);

  useEffect(() => {
    if (open && user?.role === "employee") {
      fetchPermissions();
    }
  }, [open, user]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/employee/projects/${project._id}/milestones`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch milestones");
      }

      const data = await response.json();
      setMilestones(data.milestones || []);
      setNotes(data.notes || []);
    } catch (err) {
      console.error("Error fetching milestones:", err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const token = getToken();
      const response = await fetch("/api/employee/permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permission || null);
      } else {
        setPermissions(null);
      }
    } catch (error) {
      setPermissions(null);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const updateTaskItem = async (milestoneId, featureId, itemId, completed) => {
    // Find the specific task item to validate before making API call
    const milestone = milestones.find((m) => m.id === milestoneId);
    const feature = milestone?.features?.find((f) => f.id === featureId);
    const item = feature?.items?.find((i) => i.id === itemId);

    // Debug logging for the API call
    const userId = user?._id || user?.id;
    console.log("Frontend API Call Debug:", {
      itemId,
      itemText: item?.text,
      itemAssignedTo: item?.assignedTo,
      currentUserId: userId,
      userIdFallback: { _id: user?._id, id: user?.id },
      userIdType: typeof userId,
      itemAssignedToType: typeof item?.assignedTo,
      completed,
    });

    // Frontend validation for unassigned tasks
    if (!item?.assignedTo) {
      setSnackbar({
        open: true,
        message:
          "This task is unassigned. Please assign it to someone before marking as complete.",
        severity: "info",
      });
      return;
    }

    // Check if user has permission to complete this task (handle string/ObjectId comparison)
    // Handle both _id and id properties from user object
    const isAssignedToUser =
      item.assignedTo &&
      userId &&
      (item.assignedTo === userId ||
        item.assignedTo.toString() === userId.toString());
    const hasEditPermission = canEdit;

    if (!hasEditPermission && !isAssignedToUser) {
      setSnackbar({
        open: true,
        message:
          "You can only complete tasks assigned to you. Contact management for edit permissions.",
        severity: "info",
      });
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `/api/employee/projects/${project._id}/milestones`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            milestoneId,
            featureId,
            itemId,
            completed,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));

        // Handle specific known restrictions with friendly messages
        if (response.status === 403) {
          if (errorData.error?.includes("unassigned tasks")) {
            setSnackbar({
              open: true,
              message:
                "This task is unassigned. Please assign it to someone before marking as complete.",
              severity: "info",
            });
            return;
          } else if (
            errorData.error?.includes("only update tasks assigned to you")
          ) {
            setSnackbar({
              open: true,
              message: "You can only complete tasks assigned to you.",
              severity: "info",
            });
            return;
          }
        }

        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: { milestoneId, featureId, itemId, completed },
        });
        throw new Error(
          errorData.error || `Failed to update task item (${response.status})`
        );
      }

      const data = await response.json();
      setMilestones(data.milestones || []);

      setSnackbar({
        open: true,
        message: "Task item updated successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Error updating task item:", err);
      // Only show actual unexpected errors, not restriction messages
      setSnackbar({
        open: true,
        message: "Failed to update task item. Please try again.",
        severity: "error",
      });
    }
  };

  const toggleFeatureExpansion = (milestoneId, featureId) => {
    const key = `${milestoneId}_${featureId}`;
    setExpandedFeature({
      ...expandedFeature,
      [key]: !expandedFeature[key],
    });
  };

  const toggleNoteExpansion = (noteId) => {
    setExpandedNote({
      ...expandedNote,
      [noteId]: !expandedNote[noteId],
    });
  };

  // Add drag and drop functionality for feature items
  const handleReorderFeatureItems = (
    milestoneId,
    featureId,
    sourceIdx,
    destIdx
  ) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const featureIndex = milestone?.features.findIndex(
      (f) => f.id === featureId
    );

    if (milestone && featureIndex !== -1) {
      const feature = milestone.features[featureIndex];
      const reorderedItems = [...feature.items];
      const [movedItem] = reorderedItems.splice(sourceIdx, 1);
      reorderedItems.splice(destIdx, 0, movedItem);

      const updatedFeatures = [...milestone.features];
      updatedFeatures[featureIndex] = { ...feature, items: reorderedItems };

      setMilestones(
        milestones.map((m) =>
          m.id === milestoneId ? { ...m, features: updatedFeatures } : m
        )
      );
    }
  };

  const handleFeatureUpdate = (milestoneId, featureId, field, value) => {
    setMilestones(
      milestones.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              features: m.features.map((f) =>
                f.id === featureId ? { ...f, [field]: value } : f
              ),
            }
          : m
      )
    );
  };

  const handleClose = () => {
    setExpandedMilestone(null);
    setExpandedFeature({});
    setExpandedNote({});
    setAssignmentModal({
      open: false,
      taskItem: null,
      milestone: null,
      feature: null,
    });
    onClose();
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
  };

  // Task assignment functions
  const openAssignmentModal = (milestone, feature, item) => {
    setAssignmentModal({
      open: true,
      taskItem: item,
      milestone: milestone,
      feature: feature,
    });
  };

  const closeAssignmentModal = () => {
    setAssignmentModal({
      open: false,
      taskItem: null,
      milestone: null,
      feature: null,
    });
  };

  const handleTaskAssignment = async (
    milestoneId,
    featureId,
    itemId,
    assignmentData
  ) => {
    try {
      // Update the local state
      setMilestones((prevMilestones) =>
        prevMilestones.map((milestone) =>
          milestone.id === milestoneId
            ? {
                ...milestone,
                features: milestone.features.map((feature) =>
                  feature.id === featureId
                    ? {
                        ...feature,
                        items: feature.items.map((item) =>
                          item.id === itemId
                            ? {
                                ...item,
                                assignedTo: assignmentData.assignedTo,
                                dueDate: assignmentData.dueDate,
                                assignedAt: assignmentData.assignedAt,
                              }
                            : item
                        ),
                      }
                    : feature
                ),
              }
            : milestone
        )
      );

      setSnackbar({
        open: true,
        message: assignmentData.assignedTo
          ? "Task assigned successfully! Click 'Save Changes' to persist."
          : "Task unassigned successfully! Click 'Save Changes' to persist.",
        severity: "success",
      });

      // Close the assignment modal
      closeAssignmentModal();
    } catch (error) {
      console.error("Error assigning task:", error);
      setSnackbar({
        open: true,
        message: "Failed to assign task: " + error.message,
        severity: "error",
      });
      throw error;
    }
  };

  // Permission check for milestone editing
  const canEdit =
    user?.role === "employee" &&
    permissions?.projectPermissions?.some(
      (p) =>
        (p.projectId === project?._id ||
          p.projectId === project?.id ||
          p.projectId?.toString() === project?._id?.toString()) &&
        p.canEditMilestone
    );

  // Debug logging for permissions
  console.log("Permission Debug:", {
    userRole: user?.role,
    hasPermissions: !!permissions,
    projectId: project?._id,
    projectPermissions: permissions?.projectPermissions,
    canEdit,
  });

  if (!project) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
            bgcolor: "primary.50",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <VisibilityIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                Project Milestones
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
              >
                {project.name} - {canEdit ? "Edit Access" : "Read Only View"}
                {canEdit && (
                  <Chip
                    label="Edit Access"
                    size="small"
                    color="success"
                    sx={{ ml: 1 }}
                  />
                )}
                {!canEdit && (
                  <Chip
                    label="Read Only"
                    size="small"
                    color="info"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "grey.50" }}>
          {loading || permissionsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <TimelineIcon />
                  Milestones ({milestones.length})
                </Typography>
                <Chip
                  label={canEdit ? "Edit Access" : "Read Only"}
                  variant="outlined"
                  color={canEdit ? "success" : "info"}
                  sx={{ fontWeight: 600, pointerEvents: "none" }}
                />
              </Box>

              {/* Add Milestone and Add Note buttons for edit access */}
              {canEdit && (
                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const newMilestone = {
                        id: `milestone_${Date.now()}`,
                        name: `Milestone ${milestones.length + 1}`,
                        title: "",
                        description: "",
                        startDate: null,
                        endDate: null,
                        features: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      };
                      setMilestones([...milestones, newMilestone]);
                      setEditingMilestone(newMilestone.id);
                      setExpandedMilestone(newMilestone.id);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                    }}
                  >
                    Add Milestone
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const newNote = {
                        id: `note_${Date.now()}`,
                        title: "",
                        description: "",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        order: notes.length,
                      };
                      setNotes([...notes, newNote]);
                      setEditingNote(newNote.id);
                      setExpandedNote({ ...expandedNote, [newNote.id]: true });
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                    }}
                  >
                    Add Note
                  </Button>
                </Box>
              )}

              {/* Render milestones and notes with edit/delete if canEdit */}
              {milestones.length === 0 && notes.length === 0 ? (
                <Paper
                  sx={{
                    p: 6,
                    textAlign: "center",
                    bgcolor: "white",
                    borderRadius: 4,
                    border: "2px dashed",
                    borderColor: "grey.300",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <TimelineIcon
                    sx={{ fontSize: 64, color: "grey.400", mb: 3 }}
                  />
                  <Typography
                    variant="h5"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    No milestones or notes yet
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Create your first milestone or add notes to start organizing
                    your project.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <EmployeeMilestoneList
                    milestones={milestones}
                    canEdit={canEdit}
                    expandedMilestone={expandedMilestone}
                    setExpandedMilestone={setExpandedMilestone}
                    editingMilestone={editingMilestone}
                    setEditingMilestone={setEditingMilestone}
                    setMilestones={setMilestones}
                    milestoneToDelete={milestoneToDelete}
                    setMilestoneToDelete={setMilestoneToDelete}
                    // ...pass other needed props/handlers...
                  />
                  {/* Notes Section */}
                  <Box sx={{ mt: 4 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <NotesIcon />
                      Notes ({notes.length})
                    </Typography>
                    {notes.length === 0 ? (
                      <Paper
                        sx={{
                          p: 6,
                          textAlign: "center",
                          bgcolor: "white",
                          borderRadius: 4,
                          border: "2px dashed",
                          borderColor: "grey.300",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      >
                        <NotesIcon
                          sx={{ fontSize: 64, color: "grey.400", mb: 3 }}
                        />
                        <Typography
                          variant="h5"
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          No Notes Available
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          This project doesn't have any notes yet.
                        </Typography>
                      </Paper>
                    ) : (
                      <EmployeeNotesList
                        notes={notes}
                        canEdit={canEdit}
                        // ...pass other needed props/handlers...
                      />
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "white",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {(milestones.length > 0 || notes.length > 0) && (
              <>
                <TimelineIcon fontSize="small" />
                {milestones.length > 0 && (
                  <>
                    {milestones.length} milestone
                    {milestones.length !== 1 ? "s" : ""}
                    {notes.length > 0 && " • "}
                  </>
                )}
                {notes.length > 0 && (
                  <>
                    <NotesIcon fontSize="small" />
                    {notes.length} note{notes.length !== 1 ? "s" : ""}
                  </>
                )}
              </>
            )}
          </Typography>
          {canEdit ? (
            <Button
              onClick={async () => {
                // Save milestones and notes via API for employees
                try {
                  const token = getToken();
                  const response = await fetch(
                    `/api/employee/projects/${project._id}/milestones/edit`,
                    {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ milestones, notes }),
                    }
                  );
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                      errorData.error || "Failed to save milestones"
                    );
                  }
                  const data = await response.json();
                  setSnackbar({
                    open: true,
                    message: data.message || "Milestones and notes saved!",
                    severity: "success",
                  });
                  setEditingMilestone(null);
                  setEditingFeature(null);
                  setEditingItem(null);
                  setEditingNote(null);
                  setExpandedMilestone(null);
                  setExpandedFeature({});
                  setExpandedNote({});
                  if (onClose) onClose();
                } catch (err) {
                  setSnackbar({
                    open: true,
                    message: err.message,
                    severity: "error",
                  });
                }
              }}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": { borderWidth: 2 },
              }}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": { borderWidth: 2 },
              }}
            >
              Close
            </Button>
          )}
        </DialogActions>

        {/* Task Assignment Modal */}
        <TaskAssignmentModal
          open={assignmentModal.open}
          onClose={closeAssignmentModal}
          onAssign={handleTaskAssignment}
          project={project}
          taskItem={assignmentModal.taskItem}
          milestone={assignmentModal.milestone}
          feature={assignmentModal.feature}
          user={user}
        />

        <CustomSnackbar
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          severity={snackbar.severity}
        />
        <ConfirmationModal
          isOpen={!!milestoneToDelete}
          title="Delete Milestone"
          message="Are you sure you want to delete the milestone ? This action cannot be undone after you have pressed the main SAVE CHANGES button."
          onConfirm={() => {
            setMilestones(milestones.filter((m) => m.id !== milestoneToDelete));
            setMilestoneToDelete(null);
          }}
          onClose={() => {
            setMilestoneToDelete(null);
          }}
        />
      </Dialog>
    </>
  );
};

export default EmployeeMilestoneModal;
