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
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import Grid from "@mui/material/Grid";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ConfirmationModal from "./ConfirmationModal";
import DebouncedTextField from "./DebouncedTextField";

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
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingNote, setEditingNote] = useState(null);

  const project = assignment?.projectId;

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
      const response = await fetch(`/api/employee/projects/${project._id}/milestones`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
    const milestone = milestones.find(m => m.id === milestoneId);
    const feature = milestone?.features?.find(f => f.id === featureId);
    const item = feature?.items?.find(i => i.id === itemId);
    
    // Debug logging for the API call
    const userId = user?._id || user?.id;
    console.log('Frontend API Call Debug:', {
      itemId,
      itemText: item?.text,
      itemAssignedTo: item?.assignedTo,
      currentUserId: userId,
      userIdFallback: { _id: user?._id, id: user?.id },
      userIdType: typeof userId,
      itemAssignedToType: typeof item?.assignedTo,
      completed
    });
    
    // Frontend validation for unassigned tasks
    if (!item?.assignedTo) {
      setSnackbar({
        open: true,
        message: "This task is unassigned. Please assign it to someone before marking as complete.",
        severity: "info",
      });
      return;
    }
    
    // Check if user has permission to complete this task (handle string/ObjectId comparison)
    // Handle both _id and id properties from user object
    const isAssignedToUser = item.assignedTo && userId && 
      (item.assignedTo === userId || item.assignedTo.toString() === userId.toString());
    const hasEditPermission = canEdit;
    
    if (!hasEditPermission && !isAssignedToUser) {
      setSnackbar({
        open: true,
        message: "You can only complete tasks assigned to you. Contact management for edit permissions.",
        severity: "info",
      });
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/employee/projects/${project._id}/milestones`, {
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Handle specific known restrictions with friendly messages
        if (response.status === 403) {
          if (errorData.error?.includes("unassigned tasks")) {
            setSnackbar({
              open: true,
              message: "This task is unassigned. Please assign it to someone before marking as complete.",
              severity: "info",
            });
            return;
          } else if (errorData.error?.includes("only update tasks assigned to you")) {
            setSnackbar({
              open: true,
              message: "You can only complete tasks assigned to you.",
              severity: "info",
            });
            return;
          }
        }
        
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: { milestoneId, featureId, itemId, completed }
        });
        throw new Error(errorData.error || `Failed to update task item (${response.status})`);
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
  const handleReorderFeatureItems = (milestoneId, featureId, sourceIdx, destIdx) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const featureIndex = milestone?.features.findIndex((f) => f.id === featureId);
    
    if (milestone && featureIndex !== -1) {
      const feature = milestone.features[featureIndex];
      const reorderedItems = [...feature.items];
      const [movedItem] = reorderedItems.splice(sourceIdx, 1);
      reorderedItems.splice(destIdx, 0, movedItem);
      
      const updatedFeatures = [...milestone.features];
      updatedFeatures[featureIndex] = { ...feature, items: reorderedItems };
      
      setMilestones(milestones.map(m => 
        m.id === milestoneId ? { ...m, features: updatedFeatures } : m
      ));
    }
  };

  const handleFeatureUpdate = (milestoneId, featureId, field, value) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { 
            ...m, 
            features: m.features.map(f => 
              f.id === featureId ? { ...f, [field]: value } : f
            )
          } 
        : m
    ));
  };

  const handleClose = () => {
    setExpandedMilestone(null);
    setExpandedFeature({});
    setExpandedNote({});
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

  const handleSaveMilestone = async (milestone) => {
    // Save milestone logic
  };

  const handleSaveFeature = async (feature) => {
    // Save feature logic
  };

  const handleSaveItem = async (item) => {
    // Save item logic
  };

  const handleSaveNote = async (note) => {
    // Save note logic
  };

  const handleDeleteMilestone = async (milestoneId) => {
    // Delete milestone logic
  };

  const handleDeleteFeature = async (featureId) => {
    // Delete feature logic
  };

  const handleDeleteItem = async (itemId) => {
    // Delete item logic
  };

  const handleDeleteNote = async (noteId) => {
    // Delete note logic
  };

  // Permission check for milestone editing
  const canEdit =
    user?.role === "employee" &&
    permissions?.projectPermissions?.some(
      (p) =>
        (p.projectId === project?._id ||
          p.projectId === project?.id ||
          (p.projectId?.toString() === project?._id?.toString())) &&
        p.canEditMilestone
    );

  // Debug logging for permissions
  console.log('Permission Debug:', {
    userRole: user?.role,
    hasPermissions: !!permissions,
    projectId: project?._id,
    projectPermissions: permissions?.projectPermissions,
    canEdit
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
              <Typography variant="body2" color="text.secondary" component="div">
                {project.name} - {canEdit ? "Edit Access" : "Read Only View"}
                {canEdit && (
                  <Chip label="Edit Access" size="small" color="success" sx={{ ml: 1 }} />
                )}
                {!canEdit && (
                  <Chip label="Read Only" size="small" color="info" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "grey.50" }}>
          {(loading || permissionsLoading) ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : (
            <>
              {user?.role === "employee" && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity={canEdit ? "success" : "info"} sx={{ borderRadius: 2 }}>
                    {canEdit
                      ? "You have been granted permission to edit project milestones. You can add, modify, and delete milestones and notes."
                      : "You can view project milestones but cannot edit them. Contact management if you need editing permissions."}
                  </Alert>
                </Box>
              )}

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
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, py: 1 }}
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
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, py: 1 }}
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
                  <TimelineIcon sx={{ fontSize: 64, color: "grey.400", mb: 3 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                    No milestones or notes yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first milestone or add notes to start organizing your project.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {milestones.map((milestone) => (
                    <Card key={milestone.id} sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "all 0.3s ease" }}>
                      {/* Remove Paper wrapper here if present, as Card already renders a div */}
                      <Accordion expanded={expandedMilestone === milestone.id} onChange={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            bgcolor: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                            borderRadius: "12px 12px 0 0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            "& .MuiAccordionSummary-content": { alignItems: "center", py: 1 },
                            "&:hover": { bgcolor: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)" },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                            <FlagIcon sx={{ color: "primary.main", fontSize: 24 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.dark" }}>{milestone.name}</Typography>
                            {milestone.title && <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>{milestone.title}</Typography>}
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                            {milestone.features.length > 0 && <Chip label={`${milestone.features.length} Features`} size="small" sx={{ pointerEvents: "none" }} color="primary" variant="outlined" clickable={false} />}
                            {milestone.startDate && milestone.endDate && <Chip label={`${new Date(milestone.startDate).toLocaleDateString()} - ${new Date(milestone.endDate).toLocaleDateString()}`} size="small" sx={{ pointerEvents: "none" }} icon={<CalendarIcon />} variant="outlined" clickable={false} />}
                          </Box>
                          {canEdit && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Edit milestone">
                                {/* Use a span with style and tabIndex to avoid button nesting and allow keyboard accessibility */}
                                <span
                                  style={{ display: "inline-flex" }}
                                  tabIndex={0}
                                  aria-label="Edit milestone"
                                  onClick={e => { e.stopPropagation(); setEditingMilestone(milestone.id); }}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setEditingMilestone(milestone.id); } }}
                                >
                                  <IconButton
                                    size="small"
                                    tabIndex={-1}
                                    sx={{
                                      backgroundColor: "info.light",
                                      color: "white",
                                      '&:hover': { color: "white", backgroundColor: "info.main" }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete milestone">
                                <span
                                  style={{ display: "inline-flex" }}
                                  tabIndex={0}
                                  role="button"
                                  aria-label="Delete milestone"
                                  onClick={e => { e.stopPropagation(); setMilestones(milestones.filter(m => m.id !== milestone.id)); }}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setMilestones(milestones.filter(m => m.id !== milestone.id)); } }}
                                >
                                  <IconButton
                                    size="small"
                                    tabIndex={-1}
                                    sx={{
                                      backgroundColor: "error.light",
                                      color: "white",
                                      '&:hover': { color: "white", backgroundColor: "error.main" }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          )}
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 4, bgcolor: "grey.50" }}>
                          {editingMilestone === milestone.id && canEdit ? (
                            <Box sx={{ bgcolor: "white", p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Milestone Title"
                                    value={milestone.title}
                                    onChange={e => setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, title: e.target.value } : m))}
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Milestone Name"
                                    value={milestone.name}
                                    onChange={e => setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, name: e.target.value } : m))}
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Description"
                                    value={milestone.description}
                                    onChange={e => setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, description: e.target.value } : m))}
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                      label="Start Date"
                                      value={milestone.startDate ? new Date(milestone.startDate) : null}
                                      onChange={date => setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, startDate: date } : m))}
                                      slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
                                    />
                                  </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                      label="End Date"
                                      value={milestone.endDate ? new Date(milestone.endDate) : null}
                                      onChange={date => setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, endDate: date } : m))}
                                      slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
                                      minDate={milestone.startDate ? new Date(milestone.startDate) : undefined}
                                    />
                                  </LocalizationProvider>
                                </Grid>
                              </Grid>
                              {/* Features Section - Collapsible */}
                              <Box sx={{ mt: 4 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                  <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                    <AssignmentIcon /> Features to Implement ({milestone.features.length})
                                  </Typography>
                                  {canEdit && (
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<AddIcon />}
                                      onClick={() => {
                                        const newFeature = { id: `feature_${Date.now()}`, topic: "", items: [] };
                                        setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, features: [...m.features, newFeature] } : m));
                                        setEditingFeature({ milestoneId: milestone.id, featureId: newFeature.id });
                                        setExpandedFeature({ ...expandedFeature, [`${milestone.id}_${newFeature.id}`]: true });
                                      }}
                                      sx={{ borderRadius: 2, px: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
                                    >
                                      Add Feature
                                    </Button>
                                  )}
                                </Box>

                                {milestone.features.length === 0 ? (
                                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", borderRadius: 3, border: "2px dashed", borderColor: "grey.300" }}>
                                    <AssignmentIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>No features added yet</Typography>
                                    <Typography variant="body2" color="text.secondary">Click "Add Feature" to get started with your milestone features.</Typography>
                                  </Paper>
                                ) : (
                                  <Box>
                                    {milestone.features.map((feature) => (
                                      <Card key={feature.id} sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "1px solid", borderColor: "divider", overflow: "hidden", "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transform: "translateY(-1px)", transition: "all 0.3s ease" }}}>
                                        <CardContent sx={{ py: 0, px: 1, pb: "0!important" }}>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              p: 2,
                                              cursor: "pointer",
                                              borderRadius: 2,
                                              transition: "all 0.2s ease-in-out"
                                            }}
                                            onClick={() => toggleFeatureExpansion(milestone.id, feature.id)}
                                          >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                              <ExpandMoreIcon
                                                sx={{
                                                  color: "text.secondary",
                                                  transform: expandedFeature[`${milestone.id}_${feature.id}`] ? "rotate(180deg)" : "rotate(0deg)",
                                                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                  fontSize: 20
                                                }}
                                              />
                                              <TopicIcon sx={{ color: "primary.main", fontSize: 20 }} />

                                              {editingFeature?.milestoneId === milestone.id && editingFeature?.featureId === feature.id ? (
                                                <DebouncedTextField
                                                  fullWidth
                                                  size="small"
                                                  value={feature.topic}
                                                  onChange={(value) => handleFeatureUpdate(milestone.id, feature.id, "topic", value)}
                                                  onBlur={() => setEditingFeature(null)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                      setEditingFeature(null);
                                                    }
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  autoFocus
                                                  variant="outlined"
                                                  disabled={!canEdit}
                                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                                />
                                              ) : (
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, color: "text.primary" }}>
                                                  {feature.topic || "Untitled Feature"}
                                                </Typography>
                                              )}
                                            </Box>

                                            {canEdit && (
                                              <Box sx={{ display: "flex", gap: 1 }}>
                                                <Tooltip title="Edit feature name">
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingFeature({ milestoneId: milestone.id, featureId: feature.id });
                                                    }}
                                                    sx={{ color: "info.main", "&:hover": { color: "info.dark" } }}
                                                  >
                                                    <EditIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete feature">
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, features: m.features.filter(f => f.id !== feature.id) } : m));
                                                    }}
                                                    sx={{ color: "error.main", "&:hover": { color: "error.dark" } }}
                                                  >
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              </Box>
                                            )}
                                          </Box>

                                          {expandedFeature[`${milestone.id}_${feature.id}`] && (
                                            <Box sx={{
                                              pl: 4,
                                              pt: 2,
                                              bgcolor: "grey.50",
                                              borderRadius: 2,
                                              border: "1px solid",
                                              borderColor: "grey.200",
                                              animation: "slideDown 0.3s ease-out",
                                              "@keyframes slideDown": {
                                                "0%": { opacity: 0, transform: "translateY(-10px)", maxHeight: 0 },
                                                "100%": { opacity: 1, transform: "translateY(0)", maxHeight: "1000px" }
                                              }
                                            }}>
                                              <Box sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 2,
                                                animation: "fadeIn 0.4s ease-out",
                                                "@keyframes fadeIn": {
                                                  "0%": { opacity: 0 },
                                                  "100%": { opacity: 1 }
                                                }
                                              }}>
                                                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                                  <CheckCircleIcon fontSize="small" />
                                                  Task Items ({feature.items.length})
                                                </Typography>
                                                {canEdit && (
                                                  <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => {
                                                      const newItem = { id: `item_${Date.now()}`, text: "", completed: false };
                                                      setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, features: m.features.map(f => f.id === feature.id ? { ...f, items: [...f.items, newItem] } : f) } : m));
                                                      setEditingItem({ milestoneId: milestone.id, featureId: feature.id, itemId: newItem.id });
                                                    }}
                                                    sx={{
                                                      fontSize: "0.75rem",
                                                      py: 0.5,
                                                      px: 1.5,
                                                      borderRadius: 2,
                                                      transition: "all 0.2s ease-in-out",
                                                      "&:hover": {
                                                        transform: "translateY(-1px)",
                                                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                                                      }
                                                    }}
                                                  >
                                                    Add Item
                                                  </Button>
                                                )}
                                              </Box>

                                              {feature.items.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3, fontStyle: "italic" }}>
                                                  No task items yet. Click "Add Item" to create a checklist.
                                                </Typography>
                                              ) : (
                                                <DragDropContext
                                                  onDragEnd={(result) => {
                                                    if (!result.destination) return;
                                                    const { source, destination } = result;
                                                    handleReorderFeatureItems(milestone.id, feature.id, source.index, destination.index);
                                                  }}
                                                >
                                                  <Droppable droppableId={`droppable-${feature.id}`}>
                                                    {(provided) => (
                                                      <List
                                                        dense
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        sx={{ bgcolor: "white", borderRadius: 2, p: 1 }}
                                                      >
                                                        {feature.items.map((item, itemIndex) => {
                                                          // Check if task is assigned to current user (handle string/ObjectId comparison)
                                                          // Handle both _id and id properties from user object
                                                          const userId = user?._id || user?.id;
                                                          const isAssignedToUser = item.assignedTo && userId && 
                                                            (item.assignedTo === userId || item.assignedTo.toString() === userId.toString());
                                                          const isAssignedToOther = item.assignedTo && !isAssignedToUser;
                                                          const isManagement = user?.role === "management";
                                                          
                                                          // Debug logging for task assignment check
                                                          if (item.assignedTo && userId) {
                                                            console.log('Task Assignment Check (DragDrop):', {
                                                              itemId: item.id,
                                                              assignedTo: item.assignedTo,
                                                              userId: userId,
                                                              userIdFallback: { _id: user?._id, id: user?.id },
                                                              isAssignedToUser,
                                                              canEdit,
                                                              userRole: user.role
                                                            });
                                                          }
                                                          
                                                          // Edit permissions: 
                                                          // Edit Mode (canEdit=true): Full management powers - can edit everything
                                                          // Read-Only Mode (canEdit=false): Can only edit tasks assigned to them (or management can edit unassigned)
                                                          const canEditItem = canEdit ? true : (isAssignedToUser || (isManagement && !item.assignedTo));
                                                          
                                                          // Task completion:
                                                          // Edit Mode (canEdit=true): Can complete any task
                                                          // Read-Only Mode (canEdit=false): Can only complete tasks assigned to them
                                                          const canCompleteTask = canEdit ? true : isAssignedToUser;
                                                          
                                                          // Debug logging for canCompleteTask
                                                          if (item.assignedTo) {
                                                            console.log('Can Complete Task Check (DragDrop):', {
                                                              itemId: item.id,
                                                              itemText: item.text,
                                                              canEdit,
                                                              isAssignedToUser,
                                                              canCompleteTask,
                                                              checkboxWillBeDisabled: !canCompleteTask
                                                            });
                                                          }
                                                          
                                                          return (
                                                            <Draggable
                                                              draggableId={item.id.toString()}
                                                              index={itemIndex}
                                                              key={item.id}
                                                              isDragDisabled={!canEditItem}
                                                            >
                                                              {(provided, snapshot) => (
                                                                <ListItem
                                                                  ref={provided.innerRef}
                                                                  {...provided.draggableProps}
                                                                  sx={{
                                                                    mb: 1,
                                                                    bgcolor: snapshot.isDragging ? "primary.50" : "background.paper",
                                                                    borderRadius: 1,
                                                                    border: "1px solid",
                                                                    borderColor: snapshot.isDragging ? "primary.main" : "divider",
                                                                    transition: "all 0.2s ease",
                                                                    opacity: !item.assignedTo ? 0.5 : (isAssignedToUser ? 1 : 0.7),
                                                                    "&:hover": {
                                                                      bgcolor: !item.assignedTo ? undefined : "grey.50",
                                                                      borderColor: !item.assignedTo ? undefined : "primary.light"
                                                                    },
                                                                    cursor: canEditItem ? "grab" : "default",
                                                                    "&:active": { cursor: canEditItem ? "grabbing" : "default" }
                                                                  }}
                                                                >
                                                                  {canEditItem && (
                                                                    <Box
                                                                      {...provided.dragHandleProps}
                                                                      sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        mr: 1,
                                                                        cursor: "grab",
                                                                        "&:active": { cursor: "grabbing" }
                                                                      }}
                                                                    >
                                                                      <DragIndicatorIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                                                                    </Box>
                                                                  )}
                                                                  <FormControlLabel
                                                                    control={
                                                                      <Checkbox
                                                                        checked={item.completed || false}
                                                                        onChange={(e) => {
                                                                          if (canCompleteTask) {
                                                                            updateTaskItem(milestone.id, feature.id, item.id, e.target.checked);
                                                                          } else if (!item.assignedTo) {
                                                                            setSnackbar({
                                                                              open: true,
                                                                              message: "This task is unassigned. Please assign it to someone before marking as complete.",
                                                                              severity: "info",
                                                                            });
                                                                          } else {
                                                                            setSnackbar({
                                                                              open: true,
                                                                              message: "You can only complete tasks assigned to you.",
                                                                              severity: "info",
                                                                            });
                                                                          }
                                                                        }}
                                                                        disabled={!canCompleteTask}
                                                                        icon={<CheckBoxOutlineBlankIcon />}
                                                                        checkedIcon={<CheckBoxIcon />}
                                                                        sx={{ 
                                                                          color: "primary.main", 
                                                                          "&.Mui-checked": { color: "success.main" },
                                                                          "&.Mui-disabled": { color: "grey.400" }
                                                                        }}
                                                                      />
                                                                    }
                                                                    label={
                                                                      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                                                        {editingItem?.milestoneId === milestone.id && editingItem?.featureId === feature.id && editingItem?.itemId === item.id && canEditItem ? (
                                                                          <TextField
                                                                            fullWidth
                                                                            size="small"
                                                                            value={item.text}
                                                                            onChange={(e) => setMilestones(milestones.map(m => 
                                                                              m.id === milestone.id 
                                                                                ? { 
                                                                                    ...m, 
                                                                                    features: m.features.map(f => 
                                                                                      f.id === feature.id 
                                                                                        ? { 
                                                                                            ...f, 
                                                                                            items: f.items.map(i => 
                                                                                              i.id === item.id ? { ...i, text: e.target.value } : i
                                                                                            )
                                                                                          } 
                                                                                        : f
                                                                                    )
                                                                                  } 
                                                                                : m
                                                                            ))}
                                                                            onBlur={() => setEditingItem(null)}
                                                                            onKeyDown={(e) => {
                                                                              if (e.key === "Enter") setEditingItem(null);
                                                                            }}
                                                                            autoFocus
                                                                            variant="outlined"
                                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                                                                          />
                                                                        ) : (
                                                                          <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                              textDecoration: item.completed ? "line-through" : "none",
                                                                              color: item.completed ? "text.secondary" : "text.primary",
                                                                              cursor: canEditItem ? "pointer" : "default",
                                                                              "&:hover": canEditItem ? { color: "primary.main" } : {}
                                                                            }}
                                                                            onClick={() => canEditItem && setEditingItem({
                                                                              milestoneId: milestone.id,
                                                                              featureId: feature.id,
                                                                              itemId: item.id
                                                                            })}
                                                                          >
                                                                            {item.text || "No text provided"}
                                                                          </Typography>
                                                                        )}
                                                                        {item.assignedTo && (
                                                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                                            <Chip
                                                                              label={
                                                                                isAssignedToUser 
                                                                                  ? "Assigned to You" 
                                                                                  : "Assigned to Other"
                                                                              }
                                                                              size="small"
                                                                              color={isAssignedToUser ? "success" : "default"}
                                                                              variant={isAssignedToUser ? "filled" : "outlined"}
                                                                              sx={{ 
                                                                                fontSize: "0.7rem", 
                                                                                height: "20px",
                                                                                opacity: !item.assignedTo ? 0.5 : (isAssignedToUser ? 1 : 0.7)
                                                                              }}
                                                                            />
                                                                            {item.dueDate && (
                                                                              <Chip
                                                                                label={`Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{ 
                                                                                  fontSize: "0.7rem", 
                                                                                  height: "20px",
                                                                                  opacity: !item.assignedTo ? 0.5 : (isAssignedToUser ? 1 : 0.7)
                                                                                }}
                                                                              />
                                                                            )}
                                                                          </Box>
                                                                        )}
                                                                      </Box>
                                                                    }
                                                                    sx={{ flex: 1, mr: 1, alignItems: "flex-start" }}
                                                                  />
                                                                  {canEditItem && (
                                                                    <ListItemSecondaryAction>
                                                                      <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                        <Tooltip title="Edit item">
                                                                          <IconButton
                                                                            size="small"
                                                                            onClick={() => setEditingItem({
                                                                              milestoneId: milestone.id,
                                                                              featureId: feature.id,
                                                                              itemId: item.id
                                                                            })}
                                                                            sx={{ color: "info.main", "&:hover": { color: "info.dark" } }}
                                                                          >
                                                                            <EditIcon fontSize="small" />
                                                                          </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete item">
                                                                          <IconButton
                                                                            size="small"
                                                                            onClick={() => setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, features: m.features.map(f => f.id === feature.id ? { ...f, items: f.items.filter(i => i.id !== item.id) } : f) } : m))}
                                                                            sx={{ color: "error.main", "&:hover": { color: "error.dark" } }}
                                                                          >
                                                                            <DeleteIcon fontSize="small" />
                                                                          </IconButton>
                                                                        </Tooltip>
                                                                      </Box>
                                                                    </ListItemSecondaryAction>
                                                                  )}
                                                                </ListItem>
                                                              )}
                                                            </Draggable>
                                                          );
                                                        })}
                                                        {provided.placeholder}
                                                      </List>
                                                    )}
                                                  </Droppable>
                                                </DragDropContext>
                                              )}
                                            </Box>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                              {/* End Features Section */}
                              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                                <Button variant="contained" startIcon={<SaveIcon />} onClick={() => setEditingMilestone(null)} sx={{ borderRadius: 2, px: 3 }}>Save Edit</Button>
                                <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditingMilestone(null)} sx={{ borderRadius: 2, px: 3 }}>Cancel</Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box>
                              {milestone.description && <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>{milestone.description}</Typography>}
                              
                              {/* Features Section - View Mode (Collapsible) */}
                              <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                  <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                    <AssignmentIcon /> Features ({milestone.features.length})
                                  </Typography>
                                </Box>

                                {milestone.features.length === 0 ? (
                                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", borderRadius: 3, border: "2px dashed", borderColor: "grey.300" }}>
                                    <AssignmentIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>No features added yet</Typography>
                                    <Typography variant="body2" color="text.secondary">This milestone doesn't have any features defined.</Typography>
                                  </Paper>
                                ) : (
                                  <Box>
                                    {milestone.features.map((feature) => (
                                      <Card key={feature.id} sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "1px solid", borderColor: "divider", overflow: "hidden", "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transform: "translateY(-1px)", transition: "all 0.3s ease" }}}>
                                        <CardContent sx={{ py: 0, px: 1, pb: "0!important" }}>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              p: 2,
                                              cursor: "pointer",
                                              borderRadius: 2,
                                              transition: "all 0.2s ease-in-out"
                                            }}
                                            onClick={() => toggleFeatureExpansion(milestone.id, feature.id)}
                                          >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                              <ExpandMoreIcon
                                                sx={{
                                                  color: "text.secondary",
                                                  transform: expandedFeature[`${milestone.id}_${feature.id}`] ? "rotate(180deg)" : "rotate(0deg)",
                                                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                  fontSize: 20
                                                }}
                                              />
                                              <TopicIcon sx={{ color: "primary.main", fontSize: 20 }} />
                                              <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, color: "text.primary" }}>
                                                {feature.topic || "Untitled Feature"}
                                              </Typography>
                                            </Box>
                                          </Box>

                                          {expandedFeature[`${milestone.id}_${feature.id}`] && (
                                            <Box sx={{
                                              pl: 4,
                                              pt: 2,
                                              bgcolor: "grey.50",
                                              borderRadius: 2,
                                              border: "1px solid",
                                              borderColor: "grey.200",
                                              animation: "slideDown 0.3s ease-out",
                                              "@keyframes slideDown": {
                                                "0%": { opacity: 0, transform: "translateY(-10px)", maxHeight: 0 },
                                                "100%": { opacity: 1, transform: "translateY(0)", maxHeight: "1000px" }
                                              }
                                            }}>
                                              <Box sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 2,
                                                animation: "fadeIn 0.4s ease-out",
                                                "@keyframes fadeIn": {
                                                  "0%": { opacity: 0 },
                                                  "100%": { opacity: 1 }
                                                }
                                              }}>
                                                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                                  <CheckCircleIcon fontSize="small" />
                                                  Task Items ({feature.items.length})
                                                </Typography>
                                              </Box>

                                              {feature.items.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3, fontStyle: "italic" }}>
                                                  No task items yet.
                                                </Typography>
                                              ) : (
                                                <List dense sx={{ bgcolor: "white", borderRadius: 2, p: 1 }}>
                                                  {feature.items.map((item, itemIndex) => {
                                                    // Check if task is assigned to current user (handle string/ObjectId comparison)
                                                    // Handle both _id and id properties from user object
                                                    const userId = user?._id || user?.id;
                                                    const isAssignedToUser = item.assignedTo && userId && 
                                                      (item.assignedTo === userId || item.assignedTo.toString() === userId.toString());
                                                    const isAssignedToOther = item.assignedTo && !isAssignedToUser;
                                                    const isManagement = user?.role === "management";
                                                    
                                                    // Debug logging for task assignment check
                                                    console.log('Task Assignment Check (Read-Only):', {
                                                      itemId: item.id,
                                                      itemText: item.text,
                                                      assignedTo: item.assignedTo,
                                                      assignedToType: typeof item.assignedTo,
                                                      userId: userId,
                                                      userIdType: typeof userId,
                                                      userIdFallback: { _id: user?._id, id: user?.id },
                                                      directComparison: item.assignedTo === userId,
                                                      stringComparison: item.assignedTo?.toString() === userId?.toString(),
                                                      isAssignedToUser,
                                                      canEdit,
                                                      userRole: user?.role
                                                    });
                                                    
                                                    // Edit permissions: 
                                                    // Edit Mode (canEdit=true): Full management powers - can edit everything
                                                    // Read-Only Mode (canEdit=false): Can only edit tasks assigned to them (or management can edit unassigned)
                                                    const canEditItem = canEdit ? true : (isAssignedToUser || (isManagement && !item.assignedTo));
                                                    
                                                    // Task completion:
                                                    // Edit Mode (canEdit=true): Can complete any task
                                                    // Read-Only Mode (canEdit=false): Can only complete tasks assigned to them
                                                    const canCompleteTask = canEdit ? true : isAssignedToUser;
                                                    
                                                    // Debug logging for canCompleteTask
                                                    if (item.assignedTo) {
                                                      console.log('Can Complete Task Check:', {
                                                        itemId: item.id,
                                                        itemText: item.text,
                                                        canEdit,
                                                        isAssignedToUser,
                                                        canCompleteTask,
                                                        checkboxWillBeDisabled: !canCompleteTask
                                                      });
                                                    }
                                                    
                                                    return (
                                                      <ListItem 
                                                        key={item.id} 
                                                        sx={{ 
                                                          mb: 1, 
                                                          bgcolor: item.completed ? "success.50" : "background.paper", 
                                                          borderRadius: 1, 
                                                          border: "1px solid", 
                                                          borderColor: item.completed ? "success.200" : "divider", 
                                                          transition: "all 0.2s ease",
                                                          opacity: !item.assignedTo ? 0.5 : (isAssignedToUser ? 1 : 0.7),
                                                          "&:hover": { 
                                                            bgcolor: !item.assignedTo ? undefined : "grey.50", 
                                                            borderColor: !item.assignedTo ? undefined : "primary.light" 
                                                          }
                                                        }}
                                                      >
                                                        <FormControlLabel
                                                          control={
                                                            <Checkbox
                                                              checked={item.completed || false}
                                                              onChange={(e) => {
                                                                if (canCompleteTask) {
                                                                  updateTaskItem(milestone.id, feature.id, item.id, e.target.checked);
                                                                } else if (!item.assignedTo) {
                                                                  setSnackbar({
                                                                    open: true,
                                                                    message: "This task is unassigned. Please assign it to someone before marking as complete.",
                                                                    severity: "info",
                                                                  });
                                                                } else {
                                                                  setSnackbar({
                                                                    open: true,
                                                                    message: "You can only complete tasks assigned to you.",
                                                                    severity: "info",
                                                                  });
                                                                }
                                                              }}
                                                              disabled={!canCompleteTask}
                                                              icon={<CheckBoxOutlineBlankIcon />}
                                                              checkedIcon={<CheckBoxIcon />}
                                                              sx={{ 
                                                                color: "primary.main", 
                                                                "&.Mui-checked": { color: "success.main" },
                                                                "&.Mui-disabled": { color: "grey.400" }
                                                              }}
                                                            />
                                                          }
                                                          label={
                                                            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                                              <Typography
                                                                variant="body2"
                                                                sx={{
                                                                  textDecoration: item.completed ? "line-through" : "none",
                                                                  color: item.completed ? "text.secondary" : "text.primary",
                                                                  fontWeight: item.completed ? 400 : 500
                                                                }}
                                                              >
                                                                {item.text || "No text provided"}
                                                              </Typography>
                                                              {item.assignedTo && (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                                  <Chip
                                                                    label={
                                                                      isAssignedToUser 
                                                                        ? "Assigned to You" 
                                                                        : "Assigned to Other"
                                                                    }
                                                                    size="small"
                                                                    color={isAssignedToUser ? "success" : "default"}
                                                                    variant={isAssignedToUser ? "filled" : "outlined"}
                                                                    sx={{ 
                                                                      fontSize: "0.7rem", 
                                                                      height: "20px",
                                                                      opacity: !item.assignedTo ? 0.5 : (isAssignedToUser ? 1 : 0.7)
                                                                    }}
                                                                  />
                                                                  {item.dueDate && (
                                                                    <Chip
                                                                      label={`Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                                                                      size="small"
                                                                      variant="outlined"
                                                                      sx={{ 
                                                                        fontSize: "0.7rem", 
                                                                        height: "20px",
                                                                        opacity: !item.assignedTo ? 0.5 : (isAssignedToUser ? 1 : 0.7)
                                                                      }}
                                                                    />
                                                                  )}
                                                                </Box>
                                                              )}
                                                            </Box>
                                                          }
                                                          sx={{ flex: 1, mr: 1, alignItems: "flex-start" }}
                                                        />
                                                      </ListItem>
                                                    );
                                                  })}
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
                        <NotesIcon sx={{ fontSize: 64, color: "grey.400", mb: 3 }} />
                        <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          No Notes Available
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          This project doesn't have any notes yet.
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {notes.map((note) => (
                          <Card
                            key={note.id}
                            sx={{
                              borderRadius: 3,
                              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                              borderColor: "warning.200",
                              overflow: "hidden",
                              mb: 1,
                              bgcolor: "linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)",
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
                                  bgcolor: "linear-gradient(135deg, #fff3c4 0%, #ffcc02 100%)",
                                  borderRadius: "12px 12px 0 0",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  "& .MuiAccordionSummary-content": { alignItems: "center", py: 1 },
                                  "&:hover": { bgcolor: "linear-gradient(135deg, #fff176 0%, #ffa000 100%)" },
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                  <NotesIcon sx={{ color: "warning.dark", fontSize: 24 }} />
                                  {editingNote === note.id ? (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={note.title}
                                      onChange={(e) => setNotes(notes.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
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
                                    label={new Date(note.createdAt).toLocaleDateString()}
                                    size="small"
                                    sx={{ pointerEvents: "none" }}
                                    icon={<CalendarIcon />}
                                    variant="outlined"
                                    clickable={false}
                                  />
                                </Box>
                                {canEdit && (
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Tooltip title="Edit note title">
                                      <span
                                        style={{ display: "inline-flex" }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label="Edit note"
                                        onClick={e => { e.stopPropagation(); setEditingNote(note.id); }}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setEditingNote(note.id); } }}
                                      >
                                        <IconButton
                                          size="small"
                                          tabIndex={-1}
                                          sx={{
                                            backgroundColor: "info.light",
                                            color: "white",
                                            "&:hover": { color: "white", backgroundColor: "info.main" },
                                          }}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Delete note">
                                      <span
                                        style={{ display: "inline-flex" }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label="Delete note"
                                        onClick={e => { e.stopPropagation(); setNotes(notes.filter(n => n.id !== note.id)); }}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setNotes(notes.filter(n => n.id !== note.id)); } }}
                                      >
                                        <IconButton
                                          size="small"
                                          tabIndex={-1}
                                          sx={{
                                            backgroundColor: "error.light",
                                            color: "white",
                                            "&:hover": { color: "white", backgroundColor: "error.main" },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Box>
                                )}
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 2, bgcolor: "white" }}>
                                <Box
                                  sx={{
                                    bgcolor: "grey.50",
                                    p: 0,
                                    borderRadius: 3,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Note Description"
                                    value={note.description}
                                    onChange={(e) => setNotes(notes.map(n => n.id === note.id ? { ...n, description: e.target.value } : n))}
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
                {milestones.length > 0 && (
                  <>
                    {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
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
                  const response = await fetch(`/api/employee/projects/${project._id}/milestones/edit`, {
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
                  setSnackbar({ open: true, message: data.message || "Milestones and notes saved!", severity: "success" });
                  setEditingMilestone(null);
                  setEditingFeature(null);
                  setEditingItem(null);
                  setEditingNote(null);
                  setExpandedMilestone(null);
                  setExpandedFeature({});
                  setExpandedNote({});
                  if (onClose) onClose();
                } catch (err) {
                  setSnackbar({ open: true, message: err.message, severity: "error" });
                }
              }}
              variant="contained"
              sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 600, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 600, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
            >
              Close
            </Button>
          )}
        </DialogActions>
        <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
      </Dialog>
    </>
  );
};

export default EmployeeMilestoneModal;
