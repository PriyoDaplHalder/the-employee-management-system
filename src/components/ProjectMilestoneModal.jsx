"use client";

import { useState, useEffect, useRef } from "react";
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
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Topic as TopicIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";
import ConfirmationModal from "./ConfirmationModal";
import DebouncedTextField from "./DebouncedTextField";
import TaskAssignmentModal from "./TaskAssignmentModal";

const ProjectMilestoneModal = ({ project, open, onClose, onSuccess, user }) => {
  const [milestones, setMilestones] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [expandedFeature, setExpandedFeature] = useState({});
  const [expandedNote, setExpandedNote] = useState({});
  const [assignmentModal, setAssignmentModal] = useState({
    open: false,
    taskItem: null,
    milestone: null,
    feature: null,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    type: "", // 'milestone', 'feature', 'item', 'note'
    target: null, // object with relevant IDs and data
    title: "",
    message: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  // useRef for performance optimization
  const milestoneTitleRefs = useRef({});
  const milestoneNameRefs = useRef({});
  const milestoneDescriptionRefs = useRef({});
  const featureTopicRefs = useRef({});
  const featureItemRefs = useRef({});
  const noteRefs = useRef({});

  // Optimized update functions using refs
  const handleMilestoneUpdate = (milestoneId, field, value) => {
    if (canEdit) {
      updateMilestone(milestoneId, { [field]: value });
    }
  };

  const handleFeatureUpdate = (milestoneId, featureId, field, value) => {
    if (canEdit) {
      updateFeature(milestoneId, featureId, { [field]: value });
    }
  };

  const handleFeatureItemUpdate = (milestoneId, featureId, itemId, field, value) => {
    if (canEdit) {
      updateFeatureItem(milestoneId, featureId, itemId, { [field]: value });
    }
  };

  const handleNoteUpdate = (noteId, field, value) => {
    if (canEdit) {
      updateNote(noteId, { [field]: value });
    }
  };

  // Check if user is management or employee with editing permissions (per-project)
  const isManagement = user?.role === "management";
  const isEmployee = user?.role === "employee";
  const canEdit = isManagement || (isEmployee && permissions?.projectPermissions?.some(
    (p) => p.projectId === project?._id || p.projectId === project?.id || p.projectId?.toString() === project?._id?.toString() && p.canEditMilestone
  ));

  // Fetch user permissions if employee
  useEffect(() => {
    if (isEmployee && open) {
      fetchPermissions();
    }
  }, [isEmployee, open]);

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
      console.error("Error fetching permissions:", error);
      setPermissions(null);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Fetch assigned employees for the project
  const fetchAssignedEmployees = async () => {
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
        const projectAssignments = data.assignments?.filter(
          assignment => 
            assignment.projectId?._id === project._id || 
            assignment.projectId === project._id
        ) || [];
        setAssignedEmployees(projectAssignments);
        return projectAssignments;
      }
    } catch (error) {
      console.error("Error fetching assigned employees:", error);
    }
    return [];
  };

  // Populate employee names in milestone items
  const populateEmployeeNames = (milestones, employees) => {
    return milestones.map(milestone => ({
      ...milestone,
      features: milestone.features?.map(feature => ({
        ...feature,
        items: feature.items?.map(item => {
          if (item.assignedTo) {
            const assignedEmployee = employees.find(emp => 
              emp.employeeId?._id === item.assignedTo
            );
            return {
              ...item,
              assignedToName: assignedEmployee 
                ? `${assignedEmployee.employeeId?.firstName} ${assignedEmployee.employeeId?.lastName}`
                : 'Employee Removed'
            };
          }
          return item;
        }) || []
      })) || []
    }));
  };

  useEffect(() => {
    if (open && project) {
      fetchMilestones();
    }
  }, [open, project]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const token = getToken();
      
      // Fetch assigned employees first
      const employees = await fetchAssignedEmployees();
      
      // Use appropriate API endpoint based on user role and permissions
      const endpoint = isManagement 
        ? `/api/projects/${project._id}/milestones`
        : `/api/employee/projects/${project._id}/milestones`;
        
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch milestones");
      }

      const data = await response.json();
      
      // Populate employee names in milestone data
      const milestonesWithNames = populateEmployeeNames(data.milestones || [], employees);
      
      setMilestones(milestonesWithNames);
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

  const saveMilestones = async () => {
    setSaveLoading(true);
    try {
      const token = getToken();
      
      // Use appropriate API endpoint based on user role and permissions
      const endpoint = isManagement 
        ? `/api/projects/${project._id}/milestones`
        : `/api/employee/projects/${project._id}/milestones/edit`;
        
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestones, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save milestones");
      }

      const data = await response.json();
      
      const successMessage = isManagement 
        ? "Milestones and notes saved successfully!"
        : "Milestones and notes updated successfully using your editing permissions!";
        
      setSnackbar({
        open: true,
        message: successMessage,
        severity: "success",
      });

      // Refetch the data to ensure we have the latest version
      await fetchMilestones();

      if (onSuccess) onSuccess();
      
      // Close the modal after a short delay to allow user to see the success message
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      console.error("Error saving milestones:", err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const generateNextMilestoneName = () => {
    const existingNumbers = milestones
      .map((m) => {
        const match = m.name.match(/Milestone (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n) => n > 0);

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `Milestone ${nextNumber}`;
  };

  const addMilestone = () => {
    const newMilestone = {
      id: `milestone_${Date.now()}`,
      name: generateNextMilestoneName(),
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
  };

  const deleteMilestone = (milestoneId) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    setDeleteConfirmation({
      open: true,
      type: "milestone",
      target: { milestoneId },
      title: "Delete Milestone",
      message: `Are you sure you want to delete "${
        milestone?.name || "this milestone"
      }"? This action will permanently remove all features and items within this milestone and cannot be undone.`,
    });
  };

  const confirmDeleteMilestone = (milestoneId) => {
    setMilestones(milestones.filter((m) => m.id !== milestoneId));
    if (expandedMilestone === milestoneId) {
      setExpandedMilestone(null);
    }
    setDeleteConfirmation({
      open: false,
      type: "",
      target: null,
      title: "",
      message: "",
    });
  };

  const updateMilestone = (milestoneId, updates) => {
    setMilestones(
      milestones.map((m) =>
        m.id === milestoneId ? { ...m, ...updates, updatedAt: new Date() } : m
      )
    );
  };

  const addNotes = () => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: "",
      description: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      order: notes.length, // Add order for positioning
    };

    setNotes([...notes, newNote]);
    setEditingNote(newNote.id);
    setExpandedNote({ ...expandedNote, [newNote.id]: true });
  };

  const updateNote = (noteId, updates) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      )
    );
  };

  const deleteNote = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    setDeleteConfirmation({
      open: true,
      type: "note",
      target: { noteId },
      title: "Delete Note",
      message: `Are you sure you want to delete the note "${
        note?.title || "this note"
      }"? This action cannot be undone.`,
    });
  };

  const confirmDeleteNote = (noteId) => {
    setNotes(notes.filter((n) => n.id !== noteId));
    delete expandedNote[noteId];
    setExpandedNote({ ...expandedNote });
    setDeleteConfirmation({
      open: false,
      type: "",
      target: null,
      title: "",
      message: "",
    });
  };

  const toggleNoteExpansion = (noteId) => {
    setExpandedNote({
      ...expandedNote,
      [noteId]: !expandedNote[noteId],
    });
  };

  const addFeature = (milestoneId) => {
    const newFeature = {
      id: `feature_${Date.now()}`,
      topic: "",
      items: [],
    };

    updateMilestone(milestoneId, {
      features: [
        ...(milestones.find((m) => m.id === milestoneId)?.features || []),
        newFeature,
      ],
    });

    setEditingFeature({ milestoneId, featureId: newFeature.id });
    setExpandedFeature({
      ...expandedFeature,
      [`${milestoneId}_${newFeature.id}`]: true,
    });
  };

  const deleteFeature = (milestoneId, featureId) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const feature = milestone?.features.find((f) => f.id === featureId);
    setDeleteConfirmation({
      open: true,
      type: "feature",
      target: { milestoneId, featureId },
      title: "Delete Feature",
      message: `Are you sure you want to delete the feature "${
        feature?.topic || "this feature"
      }"? This action will permanently remove all items within this feature and cannot be undone.`,
    });
  };

  const confirmDeleteFeature = (milestoneId, featureId) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (milestone) {
      updateMilestone(milestoneId, {
        features: milestone.features.filter((f) => f.id !== featureId),
      });
    }
    delete expandedFeature[`${milestoneId}_${featureId}`];
    setExpandedFeature({ ...expandedFeature });
    setDeleteConfirmation({
      open: false,
      type: "",
      target: null,
      title: "",
      message: "",
    });
  };

  const updateFeature = (milestoneId, featureId, updates) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (milestone) {
      updateMilestone(milestoneId, {
        features: milestone.features.map((f) =>
          f.id === featureId ? { ...f, ...updates } : f
        ),
      });
    }
  };

  const addFeatureItem = (milestoneId, featureId) => {
    const newItem = {
      id: `item_${Date.now()}`,
      text: "",
      completed: false,
      assignedTo: null,
      assignedToName: null,
      dueDate: null,
      assignedAt: null,
      assignedBy: null,
    };

    const milestone = milestones.find((m) => m.id === milestoneId);
    const feature = milestone?.features.find((f) => f.id === featureId);

    if (feature) {
      updateFeature(milestoneId, featureId, {
        items: [...feature.items, newItem],
      });
      setEditingItem({ milestoneId, featureId, itemId: newItem.id });
    }
  };

  const deleteFeatureItem = (milestoneId, featureId, itemId) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const feature = milestone?.features.find((f) => f.id === featureId);
    const item = feature?.items.find((i) => i.id === itemId);
    setDeleteConfirmation({
      open: true,
      type: "item",
      target: { milestoneId, featureId, itemId },
      title: "Delete Task Item",
      message: `Are you sure you want to delete the task item "${
        item?.text || "this item"
      }"? This action cannot be undone.`,
    });
  };

  const confirmDeleteFeatureItem = (milestoneId, featureId, itemId) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const feature = milestone?.features.find((f) => f.id === featureId);

    if (feature) {
      updateFeature(milestoneId, featureId, {
        items: feature.items.filter((i) => i.id !== itemId),
      });
    }
    setDeleteConfirmation({
      open: false,
      type: "",
      target: null,
      title: "",
      message: "",
    });
  };

  const updateFeatureItem = (milestoneId, featureId, itemId, updates) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const feature = milestone?.features.find((f) => f.id === featureId);

    if (feature) {
      updateFeature(milestoneId, featureId, {
        items: feature.items.map((i) =>
          i.id === itemId ? { ...i, ...updates } : i
        ),
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

  const handleTaskAssignment = async (milestoneId, featureId, itemId, assignmentData) => {
    try {
      const milestone = milestones.find((m) => m.id === milestoneId);
      const feature = milestone?.features.find((f) => f.id === featureId);
      const item = feature?.items.find((i) => i.id === itemId);

      if (item) {
        let assignedToName = null;
        if (assignmentData.assignedTo) {
          const assignedEmployee = assignedEmployees.find(emp => 
            emp.employeeId?._id === assignmentData.assignedTo
          );
          assignedToName = assignedEmployee 
            ? `${assignedEmployee.employeeId?.firstName} ${assignedEmployee.employeeId?.lastName}`
            : 'Unknown Employee';
        }

        const updatedItem = {
          ...item,
          assignedTo: assignmentData.assignedTo,
          assignedToName: assignedToName,
          dueDate: assignmentData.dueDate,
          assignedAt: assignmentData.assignedAt,
          assignedBy: user?._id,
        };

        updateFeatureItem(milestoneId, featureId, itemId, updatedItem);

        setSnackbar({
          open: true,
          message: assignmentData.assignedTo 
            ? "Task assigned successfully! Click 'Save Changes' to persist." 
            : "Task unassigned successfully! Click 'Save Changes' to persist.",
          severity: "success",
        });

        // Close the assignment modal
        closeAssignmentModal();
      }
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

  const handleClose = () => {
    setEditingMilestone(null);
    setEditingFeature(null);
    setEditingItem(null);
    setExpandedMilestone(null);
    setExpandedFeature({});
    setAssignmentModal({
      open: false,
      taskItem: null,
      milestone: null,
      feature: null,
    });
    setDeleteConfirmation({
      open: false,
      type: "",
      target: null,
      title: "",
      message: "",
    });
    onClose();
  };

  const handleDeleteConfirm = () => {
    const { type, target } = deleteConfirmation;
    switch (type) {
      case "milestone":
        confirmDeleteMilestone(target.milestoneId);
        break;
      case "feature":
        confirmDeleteFeature(target.milestoneId, target.featureId);
        break;
      case "item":
        confirmDeleteFeatureItem(
          target.milestoneId,
          target.featureId,
          target.itemId
        );
        break;
      case "note":
        confirmDeleteNote(target.noteId);
        break;
      default:
        setDeleteConfirmation({
          open: false,
          type: "",
          target: null,
          title: "",
          message: "",
        });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      open: false,
      type: "",
      target: null,
      title: "",
      message: "",
    });
  };

  const handleEditMilestone = (milestoneId) => {
    setEditingMilestone(milestoneId);
  };

  const handleDeleteMilestone = (milestone) => {
    setDeleteConfirmation({
      open: true,
      type: "milestone",
      target: { milestoneId: milestone.id },
      title: "Delete Milestone",
      message: `Are you sure you want to delete "${
        milestone.title || "this milestone"
      }"? This action cannot be undone once save changes is clicked.`,
    });
  };

  if (!project) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
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
            <TimelineIcon color="primary" />
            <Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                Project Milestones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {project.name} - {canEdit ? 'Edit Mode' : 'View Mode'}
                {isEmployee && !canEdit && (
                  <Chip 
                    label="No Edit Permission" 
                    size="small" 
                    color="warning" 
                    sx={{ ml: 1 }}
                  />
                )}
                {isEmployee && canEdit && (
                  <Chip 
                    label="Edit Permission Granted" 
                    size="small" 
                    color="success" 
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
          {loading || (isEmployee && permissionsLoading) ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={48} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {permissionsLoading ? "Loading permissions..." : "Loading milestones..."}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Permission Alert for Employees */}
              {isEmployee && (
                <Box sx={{ mb: 3 }}>
                  <Alert 
                    severity={canEdit ? "success" : "info"}
                    sx={{ borderRadius: 2 }}
                  >
                    {canEdit 
                      ? "You have been granted permission to edit project milestones. You can add, modify, and delete milestones and notes."
                      : "You can view project milestones but cannot edit them. Contact management if you need editing permissions."
                    }
                  </Alert>
                </Box>
              )}

              {/* Add Milestone Button */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 3,
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
                {canEdit && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addMilestone}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      Add Milestone
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addNotes}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      Add notes
                    </Button>
                  </Box>
                )}
              </Box>

              {milestones.length === 0 && notes.length === 0 ? (
                <Paper
                  sx={{
                    p: 6,
                    textAlign: "center",
                    bgcolor:
                      "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
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
                  <Typography variant="caption" color="text.secondary">
                    Milestones help you organize features and track development
                    progress effectively. Notes provide additional context and
                    documentation.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ spacing: 3 }}>
                  {/* Render all milestones */}
                  {milestones.map((milestone, index) => (
                    <Card
                      key={milestone.id}
                      sx={{
                        borderRadius: 3,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                        border: "1px solid",
                        borderColor: "grey.200",
                        overflow: "hidden",
                        mb: 1,
                        "&:hover": {
                          boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                          transform: "translateY(-1px)",
                          transition: "all 0.3s ease",
                        },
                      }}
                    >
                      <Accordion
                        expanded={expandedMilestone === milestone.id}
                        onChange={() =>
                          setExpandedMilestone(
                            expandedMilestone === milestone.id
                              ? null
                              : milestone.id
                          )
                        }
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            bgcolor:
                              "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                            borderRadius: "12px 12px 0 0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            "& .MuiAccordionSummary-content": {
                              alignItems: "center",
                              py: 1,
                            },
                            "&:hover": {
                              bgcolor:
                                "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flex: 1,
                            }}
                          >
                            <FlagIcon
                              sx={{ color: "primary.main", fontSize: 24 }}
                            />
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: "primary.dark" }}
                            >
                              {milestone.name}
                            </Typography>
                            {milestone.title && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  fontStyle: "italic",
                                }}
                              >
                                {milestone.title}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                            {milestone.features.length > 0 && (
                              <Chip
                                label={`${milestone.features.length} Features`}
                                size="small"
                                sx={{ pointerEvents: "none" }}
                                color="primary"
                                variant="outlined"
                                clickable={false}
                              />
                            )}
                            {milestone.startDate && milestone.endDate && (
                              <Chip
                                label={`${new Date(
                                  milestone.startDate
                                ).toLocaleDateString()} - ${new Date(
                                  milestone.endDate
                                ).toLocaleDateString()}`}
                                size="small"
                                sx={{ pointerEvents: "none" }}
                                icon={<CalendarIcon />}
                                variant="outlined"
                                clickable={false}
                              />
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2, bgcolor: "grey.50" }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            {canEdit && (
                              <>
                                <Tooltip title="Edit milestone">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleEditMilestone(milestone.id);
                                    }}
                                    sx={{
                                      backgroundColor: "info.light",
                                      color: "white",
                                      "&:hover": {
                                        color: "white",
                                        backgroundColor: "info.main",
                                      },
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete milestone">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleDeleteMilestone(milestone);
                                    }}
                                    sx={{
                                      backgroundColor: "error.light",
                                      color: "white",
                                      "&:hover": {
                                        color: "white",
                                        backgroundColor: "error.main",
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                          {editingMilestone === milestone.id ? (
                            // Edit Milestone Form
                            <Box
                              sx={{
                                bgcolor: "white",
                                p: 3,
                                borderRadius: 3,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}
                            >
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <DebouncedTextField
                                    fullWidth
                                    label="Milestone Title"
                                    value={milestone.title}
                                    onChange={(value) =>
                                      handleMilestoneUpdate(milestone.id, "title", value)
                                    }
                                    variant="outlined"
                                    disabled={!canEdit}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <DebouncedTextField
                                    fullWidth
                                    label="Milestone Name"
                                    value={milestone.name}
                                    onChange={(value) =>
                                      handleMilestoneUpdate(milestone.id, "name", value)
                                    }
                                    variant="outlined"
                                    disabled={!canEdit}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <DebouncedTextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Description"
                                    value={milestone.description}
                                    onChange={(value) =>
                                      handleMilestoneUpdate(milestone.id, "description", value)
                                    }
                                    variant="outlined"
                                    disabled={!canEdit}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <DatePicker
                                    label="Start Date"
                                    value={
                                      milestone.startDate
                                        ? new Date(milestone.startDate)
                                        : null
                                    }
                                    onChange={(date) =>
                                      canEdit && updateMilestone(milestone.id, {
                                        startDate: date,
                                      })
                                    }
                                    disabled={!canEdit}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                      },
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <DatePicker
                                    label="End Date"
                                    value={
                                      milestone.endDate
                                        ? new Date(milestone.endDate)
                                        : null
                                    }
                                    onChange={(date) =>
                                      canEdit && updateMilestone(milestone.id, {
                                        endDate: date,
                                      })
                                    }
                                    disabled={!canEdit}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                      },
                                    }}
                                    minDate={
                                      milestone.startDate
                                        ? new Date(milestone.startDate)
                                        : undefined
                                    }
                                  />
                                </Grid>
                              </Grid>

                              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                                <Tooltip
                                  title={`This will only close the current editing window, to save you need to press the "SAVE CHANGES" button`}
                                >
                                  <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => setEditingMilestone(null)}
                                    sx={{
                                      borderRadius: 2,
                                      px: 3,
                                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    Save Edit
                                  </Button>
                                </Tooltip>
                              </Box>
                            </Box>
                          ) : (
                            // Display Milestone Details
                            <Box>
                              {milestone.description && (
                                <Typography
                                  variant="body1"
                                  sx={{ mb: 3, lineHeight: 1.6 }}
                                >
                                  {milestone.description}
                                </Typography>
                              )}

                              {/* Features Section */}
                              <Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 2,
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
                                    <AssignmentIcon />
                                    Features to Implement (
                                    {milestone.features.length})
                                  </Typography>
                                  {canEdit && (
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<AddIcon />}
                                      onClick={() => addFeature(milestone.id)}
                                      sx={{
                                        borderRadius: 2,
                                        px: 2,
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                      }}
                                    >
                                      Add Feature
                                    </Button>
                                  )}
                                </Box>

                                {milestone.features.length === 0 ? (
                                  <Paper
                                    sx={{
                                      p: 2,
                                      textAlign: "center",
                                      bgcolor:
                                        "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                      borderRadius: 3,
                                      border: "2px dashed",
                                      borderColor: "grey.300",
                                    }}
                                  >
                                    <AssignmentIcon
                                      sx={{
                                        fontSize: 48,
                                        color: "grey.400",
                                        mb: 2,
                                      }}
                                    />
                                    <Typography
                                      variant="h6"
                                      color="text.secondary"
                                      gutterBottom
                                      sx={{ fontWeight: 600 }}
                                    >
                                      No features added yet
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Click "Add Feature" to get started with
                                      your milestone features.
                                    </Typography>
                                  </Paper>
                                ) : (
                                  <Box>
                                    {milestone.features.map((feature) => (
                                      <Card
                                        key={feature.id}
                                        sx={{
                                          mb: 3,
                                          borderRadius: 3,
                                          boxShadow:
                                            "0 4px 12px rgba(0,0,0,0.1)",
                                          border: "1px solid",
                                          borderColor: "divider",
                                          overflow: "hidden",
                                          "&:hover": {
                                            boxShadow:
                                              "0 6px 20px rgba(0,0,0,0.15)",
                                            transform: "translateY(-1px)",
                                            transition: "all 0.3s ease",
                                          },
                                        }}
                                      >
                                        <CardContent sx={{ py: 0, px: 1, pb: "0!important" }}>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              p: 2,
                                              cursor: "pointer",
                                              borderRadius: 2,
                                              transition:
                                                "all 0.2s ease-in-out",
                                            }}
                                            onClick={() =>
                                              toggleFeatureExpansion(
                                                milestone.id,
                                                feature.id
                                              )
                                            }
                                          >
                                            <Box
                                              sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                flex: 1,
                                              }}
                                            >
                                              <ExpandMoreIcon
                                                sx={{
                                                  color: "text.secondary",
                                                  transform: expandedFeature[
                                                    `${milestone.id}_${feature.id}`
                                                  ]
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                  transition:
                                                    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                  fontSize: 20,
                                                }}
                                              />
                                              <TopicIcon
                                                sx={{
                                                  color: "primary.main",
                                                  fontSize: 20,
                                                }}
                                              />

                                              {editingFeature?.milestoneId ===
                                                milestone.id &&
                                              editingFeature?.featureId ===
                                                feature.id ? (
                                                <DebouncedTextField
                                                  fullWidth
                                                  size="small"
                                                  value={feature.topic}
                                                  onChange={(value) =>
                                                    handleFeatureUpdate(
                                                      milestone.id,
                                                      feature.id,
                                                      "topic",
                                                      value
                                                    )
                                                  }
                                                  onBlur={() =>
                                                    setEditingFeature(null)
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                      setEditingFeature(null);
                                                    }
                                                  }}
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  autoFocus
                                                  variant="outlined"
                                                  disabled={!canEdit}
                                                  sx={{
                                                    "& .MuiOutlinedInput-root":
                                                      {
                                                        borderRadius: 2,
                                                      },
                                                  }}
                                                />
                                              ) : (
                                                <Typography
                                                  variant="subtitle1"
                                                  sx={{
                                                    fontWeight: 600,
                                                    flex: 1,
                                                    color: "text.primary",
                                                  }}
                                                >
                                                  {feature.topic ||
                                                    "Untitled Feature"}
                                                </Typography>
                                              )}
                                            </Box>

                                            {canEdit && (
                                              <Box
                                                sx={{ display: "flex", gap: 1 }}
                                              >
                                                <Tooltip title="Edit feature name">
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingFeature({
                                                        milestoneId: milestone.id,
                                                        featureId: feature.id,
                                                      });
                                                    }}
                                                    sx={{
                                                      color: "info.main",
                                                      "&:hover": {
                                                        color: "info.dark",
                                                      },
                                                    }}
                                                  >
                                                    <EditIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete feature">
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      deleteFeature(
                                                        milestone.id,
                                                        feature.id
                                                      );
                                                    }}
                                                    sx={{
                                                      color: "error.main",
                                                      "&:hover": {
                                                        color: "error.dark",
                                                      },
                                                    }}
                                                  >
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              </Box>
                                            )}
                                          </Box>

                                          {expandedFeature[
                                            `${milestone.id}_${feature.id}`
                                          ] && (
                                            <Box
                                              sx={{
                                                pl: 4,
                                                pt: 2,
                                                bgcolor: "grey.50",
                                                borderRadius: 2,
                                                border: "1px solid",
                                                borderColor: "grey.200",
                                                animation:
                                                  "slideDown 0.3s ease-out",
                                                "@keyframes slideDown": {
                                                  "0%": {
                                                    opacity: 0,
                                                    transform:
                                                      "translateY(-10px)",
                                                    maxHeight: 0,
                                                  },
                                                  "100%": {
                                                    opacity: 1,
                                                    transform: "translateY(0)",
                                                    maxHeight: "1000px",
                                                  },
                                                },
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  justifyContent:
                                                    "space-between",
                                                  alignItems: "center",
                                                  mb: 2,
                                                  animation:
                                                    "fadeIn 0.4s ease-out",
                                                  "@keyframes fadeIn": {
                                                    "0%": {
                                                      opacity: 0,
                                                    },
                                                    "100%": {
                                                      opacity: 1,
                                                    },
                                                  },
                                                }}
                                              >
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 600,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                  }}
                                                >
                                                  <CheckCircleIcon fontSize="small" />
                                                  Task Items (
                                                  {feature.items.length})
                                                </Typography>
                                                {canEdit && (
                                                  <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={() =>
                                                      addFeatureItem(
                                                        milestone.id,
                                                        feature.id
                                                      )
                                                    }
                                                    sx={{
                                                      fontSize: "0.75rem",
                                                      py: 0.5,
                                                      px: 1.5,
                                                      borderRadius: 2,
                                                      transition:
                                                        "all 0.2s ease-in-out",
                                                      "&:hover": {
                                                        transform:
                                                          "translateY(-1px)",
                                                        boxShadow:
                                                          "0 4px 8px rgba(0,0,0,0.2)",
                                                      },
                                                    }}
                                                  >
                                                    Add Item
                                                  </Button>
                                                )}
                                              </Box>

                                              {feature.items.length === 0 ? (
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                  sx={{
                                                    textAlign: "center",
                                                    py: 3,
                                                    fontStyle: "italic",
                                                  }}
                                                >
                                                  No task items yet. Click "Add
                                                  Item" to create a checklist.
                                                </Typography>
                                              ) : (
                                                <List
                                                  dense
                                                  sx={{
                                                    bgcolor: "white",
                                                    borderRadius: 2,
                                                    p: 1,
                                                    "& .MuiListItem-root": {
                                                      animation:
                                                        "fadeInUp 0.3s ease-out",
                                                      animationFillMode: "both",
                                                    },
                                                    "@keyframes fadeInUp": {
                                                      "0%": {
                                                        opacity: 0,
                                                        transform:
                                                          "translateY(10px)",
                                                      },
                                                      "100%": {
                                                        opacity: 1,
                                                        transform:
                                                          "translateY(0)",
                                                      },
                                                    },
                                                  }}
                                                >
                                                  {feature.items.map(
                                                    (item, itemIndex) => (
                                                      <ListItem
                                                        key={item.id}
                                                        sx={{
                                                          px: 2,
                                                          py: 1,
                                                          mb: 1,
                                                          bgcolor:
                                                            item.completed
                                                              ? "success.50"
                                                              : "grey.50",
                                                          borderRadius: 2,
                                                          border: "1px solid",
                                                          borderColor:
                                                            item.completed
                                                              ? "success.200"
                                                              : "grey.200",
                                                          transition:
                                                            "all 0.2s ease-in-out",
                                                          animationDelay: `${
                                                            itemIndex * 0.05
                                                          }s`,
                                                          "&:hover": {
                                                            bgcolor:
                                                              item.completed
                                                                ? "success.100"
                                                                : "grey.100",
                                                            transform:
                                                              "translateX(4px)",
                                                            boxShadow:
                                                              "0 2px 4px rgba(0,0,0,0.1)",
                                                          },
                                                        }}
                                                      >
                                                        <FormControlLabel
                                                          control={
                                                            <Checkbox
                                                              checked={
                                                                item.completed
                                                              }
                                                              onChange={(e) =>
                                                                canEdit && updateFeatureItem(
                                                                  milestone.id,
                                                                  feature.id,
                                                                  item.id,
                                                                  {
                                                                    completed:
                                                                      e.target
                                                                        .checked,
                                                                  }
                                                                )
                                                              }
                                                              disabled={!canEdit}
                                                              icon={
                                                                <RadioButtonUncheckedIcon />
                                                              }
                                                              checkedIcon={
                                                                <CheckCircleIcon />
                                                              }
                                                              sx={{
                                                                color:
                                                                  "success.main",
                                                                borderRadius: 1, // Make square
                                                                '&.Mui-checked': {
                                                                  color: 'success.main',
                                                                },
                                                                '&.Mui-disabled': {
                                                                  color: 'grey.400',
                                                                },
                                                              }}
                                                            />
                                                          }
                                                          label={
                                                            <Box sx={{ width: "100%" }}>
                                                              {editingItem?.milestoneId ===
                                                                milestone.id &&
                                                              editingItem?.featureId ===
                                                                feature.id &&
                                                              editingItem?.itemId ===
                                                                item.id &&
                                                              canEdit ? (
                                                                <TextField
                                                                  size="small"
                                                                  value={
                                                                    item.text
                                                                  }
                                                                  onChange={(e) =>
                                                                    handleFeatureItemUpdate(
                                                                      milestone.id,
                                                                      feature.id,
                                                                      item.id,
                                                                      "text",
                                                                      e.target.value
                                                                    )
                                                                  }
                                                                  onBlur={() =>
                                                                    setEditingItem(
                                                                      null
                                                                    )
                                                                  }
                                                                  onKeyDown={(
                                                                    e
                                                                  ) => {
                                                                    if (
                                                                      e.key ===
                                                                      "Enter"
                                                                    ) {
                                                                      setEditingItem(
                                                                        null
                                                                      );
                                                                    }
                                                                  }}
                                                                  autoFocus
                                                                  variant="standard"
                                                                  disabled={!canEdit}
                                                                  sx={{
                                                                    "& .MuiInput-underline:before":
                                                                      {
                                                                        borderBottomColor:
                                                                          "primary.main",
                                                                      },
                                                                  }}
                                                                />
                                                              ) : (
                                                                <Box>
                                                                  <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                      textDecoration:
                                                                        item.completed
                                                                          ? "line-through"
                                                                          : "none",
                                                                      color:
                                                                        item.completed
                                                                          ? "text.secondary"
                                                                          : "text.primary",
                                                                      fontWeight:
                                                                        item.completed
                                                                          ? 400
                                                                          : 500,
                                                                    }}
                                                                  >
                                                                    {item.text ||
                                                                      "No text provided"}
                                                                  </Typography>
                                                                  {/* Assignment Status Chip */}
                                                                  <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                                    {item.assignedTo ? (
                                                                      <Chip
                                                                        size="small"
                                                                        label={`Assigned to: ${item.assignedToName || 'Employee'}`}
                                                                        color="primary"
                                                                        variant="outlined"
                                                                        sx={{ fontSize: "0.7rem", pointerEvents: "none" }}
                                                                      />
                                                                    ) : (
                                                                      <Chip
                                                                        size="small"
                                                                        label="None assigned"
                                                                        color="default"
                                                                        variant="outlined"
                                                                        sx={{ fontSize: "0.7rem", pointerEvents: "none" }}
                                                                      />
                                                                    )}
                                                                    {item.dueDate && (
                                                                      <Chip
                                                                        size="small"
                                                                        label={`Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                                                                        color="warning"
                                                                        variant="outlined"
                                                                        icon={<CalendarIcon />}
                                                                        sx={{ fontSize: "0.7rem" }}
                                                                      />
                                                                    )}
                                                                  </Box>
                                                                </Box>
                                                              )}
                                                            </Box>
                                                          }
                                                          sx={{
                                                            flex: 1,
                                                            mr: 1,
                                                          }}
                                                        />

                                                        <ListItemSecondaryAction>
                                                          {canEdit && (
                                                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                                              <Button 
                                                                variant="outlined" 
                                                                size="small"
                                                                onClick={() => openAssignmentModal(milestone, feature, item)}
                                                              >
                                                                Assign
                                                              </Button>
                                                              <Tooltip title="Edit item">
                                                                <IconButton
                                                                  size="small"
                                                                  onClick={() =>
                                                                    setEditingItem({
                                                                      milestoneId: milestone.id,
                                                                      featureId: feature.id,
                                                                      itemId: item.id,
                                                                    })
                                                                  }
                                                                  sx={{
                                                                    color: "info.main",
                                                                    "&:hover": {
                                                                      color: "info.dark",
                                                                    },
                                                                  }}
                                                                >
                                                                  <EditIcon fontSize="small" />
                                                                </IconButton>
                                                              </Tooltip>
                                                              <Tooltip title="Delete item">
                                                                <IconButton
                                                                  size="small"
                                                                  onClick={() =>
                                                                    deleteFeatureItem(
                                                                      milestone.id,
                                                                      feature.id,
                                                                      item.id
                                                                    )
                                                                  }
                                                                  sx={{
                                                                    color:
                                                                      "error.main",
                                                                    "&:hover": {
                                                                      color:
                                                                        "error.dark",
                                                                    },
                                                                  }}
                                                                >
                                                                  <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                              </Tooltip>
                                                            </Box>
                                                          )}
                                                        </ListItemSecondaryAction>
                                                      </ListItem>
                                                    )
                                                  )}
                                                </List>
                                              )}
                                            </Box>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Card>
                  ))}

                  {/* Render all notes */}
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
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {notes.map((note) => (
                          <Card
                            key={note.id}
                            sx={{
                              borderRadius: 3,
                              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                              borderColor: "warning.200",
                              overflow: "hidden",
                              mb: 1,
                              bgcolor:
                                "linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)",
                              "&:hover": {
                                boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                                transform: "translateY(-1px)",
                                transition: "all 0.3s ease",
                              },
                            }}
                          >
                            <Accordion
                              expanded={!!expandedNote[note.id]}
                              onChange={() => toggleNoteExpansion(note.id)}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                  bgcolor:
                                    "linear-gradient(135deg, #fff3c4 0%, #ffcc02 100%)",
                                  borderRadius: "12px 12px 0 0",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  "& .MuiAccordionSummary-content": {
                                    alignItems: "center",
                                    py: 1,
                                  },
                                  "&:hover": {
                                    bgcolor:
                                      "linear-gradient(135deg, #fff176 0%, #ffa000 100%)",
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flex: 1,
                                  }}
                                >
                                  <NotesIcon
                                    sx={{ color: "warning.dark", fontSize: 24 }}
                                  />
                                  {editingNote === note.id ? (
                                    <DebouncedTextField
                                      fullWidth
                                      size="small"
                                      value={note.title}
                                      onChange={(value) =>
                                        handleNoteUpdate(note.id, "title", value)
                                      }
                                      onBlur={() => setEditingNote(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          setEditingNote(null);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      autoFocus
                                      placeholder="Enter note title..."
                                      variant="outlined"
                                      disabled={!canEdit}
                                      sx={{
                                        "& .MuiOutlinedInput-root": {
                                          borderRadius: 2,
                                          bgcolor: "white",
                                        },
                                      }}
                                    />
                                  ) : (
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        fontWeight: 700,
                                        color: "warning.dark",
                                        cursor: canEdit ? "pointer" : "default",
                                      }}
                                      onClick={(e) => {
                                        if (canEdit) {
                                          e.stopPropagation();
                                          setEditingNote(note.id);
                                        }
                                      }}
                                    >
                                      {note.title || "Untitled Note"}
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                                  <Chip
                                    label={new Date(
                                      note.createdAt
                                    ).toLocaleDateString()}
                                    size="small"
                                    sx={{ pointerEvents: "none" }}
                                    icon={<CalendarIcon />}
                                    variant="outlined"
                                    clickable={false}
                                  />
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 2, bgcolor: "white" }}>
                                {canEdit && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      gap: 1,
                                      mb: 1,
                                    }}
                                  >
                                    <Tooltip title="Edit note title">
                                      <IconButton
                                        size="small"
                                        onClick={() => setEditingNote(note.id)}
                                        sx={{
                                          backgroundColor: "info.light",
                                          color: "white",
                                          "&:hover": {
                                            color: "white",
                                            backgroundColor: "info.main",
                                          },
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete note">
                                      <IconButton
                                        size="small"
                                        onClick={() => deleteNote(note.id)}
                                        sx={{
                                          backgroundColor: "error.light",
                                          color: "white",
                                          "&:hover": {
                                            color: "white",
                                            backgroundColor: "error.main",
                                          },
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}

                                <Box
                                  sx={{
                                    bgcolor: "grey.50",
                                    p: 0,
                                    borderRadius: 3,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <DebouncedTextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Note Description"
                                    value={note.description}
                                    onChange={(value) =>
                                      handleNoteUpdate(note.id, "description", value)
                                    }
                                    placeholder="Add your note content here..."
                                    variant="outlined"
                                    disabled={!canEdit}
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: canEdit ? "white" : "grey.100",
                                      },
                                    }}
                                  />
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          </Card>
                        ))}
                      </Box>
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
                Total: {milestones.length} milestone
                {milestones.length !== 1 ? "s" : ""}
                {notes.length > 0 && (
                  <>
                    {milestones.length > 0 && ", "}
                    <NotesIcon fontSize="small" />
                    {notes.length} note{notes.length !== 1 ? "s" : ""}
                  </>
                )}
              </>
            )}
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            {canEdit && (
              <Button
                variant="contained"
                onClick={saveMilestones}
                disabled={saveLoading}
                startIcon={
                  saveLoading ? <CircularProgress size={16} /> : <SaveIcon />
                }
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                  },
                }}
              >
                Save Changes
              </Button>
            )}
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
          </Box>
        </DialogActions>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteConfirmation.open}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deleteConfirmation.title}
          message={deleteConfirmation.message}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      </Dialog>
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      {/* Task Assignment Modal */}
      <TaskAssignmentModal
        open={assignmentModal.open}
        onClose={closeAssignmentModal}
        onAssign={handleTaskAssignment}
        project={project}
        taskItem={assignmentModal.taskItem}
        milestone={assignmentModal.milestone}
        feature={assignmentModal.feature}
      />
    </LocalizationProvider>
  );
};

export default ProjectMilestoneModal;
