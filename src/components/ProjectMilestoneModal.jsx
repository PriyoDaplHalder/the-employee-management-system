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
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";
import ConfirmationModal from "./ConfirmationModal";

const ProjectMilestoneModal = ({ project, open, onClose, onSuccess }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [expandedFeature, setExpandedFeature] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    type: '', // 'milestone', 'feature', 'item'
    target: null, // object with relevant IDs and data
    title: '',
    message: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open && project) {
      fetchMilestones();
    }
  }, [open, project]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/projects/${project._id}/milestones`, {
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
      const response = await fetch(`/api/projects/${project._id}/milestones`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestones }),
      });

      if (!response.ok) {
        throw new Error("Failed to save milestones");
      }

      setSnackbar({
        open: true,
        message: "Milestones saved successfully!",
        severity: "success",
      });
      
      if (onSuccess) onSuccess();
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
      .map(m => {
        const match = m.name.match(/Milestone (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
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
    const milestone = milestones.find(m => m.id === milestoneId);
    setDeleteConfirmation({
      open: true,
      type: 'milestone',
      target: { milestoneId },
      title: 'Delete Milestone',
      message: `Are you sure you want to delete "${milestone?.name || 'this milestone'}"? This action will permanently remove all features and items within this milestone and cannot be undone.`
    });
  };

  const confirmDeleteMilestone = (milestoneId) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
    if (expandedMilestone === milestoneId) {
      setExpandedMilestone(null);
    }
    setDeleteConfirmation({ open: false, type: '', target: null, title: '', message: '' });
  };

  const updateMilestone = (milestoneId, updates) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, ...updates, updatedAt: new Date() }
        : m
    ));
  };

  const addFeature = (milestoneId) => {
    const newFeature = {
      id: `feature_${Date.now()}`,
      topic: "",
      items: []
    };
    
    updateMilestone(milestoneId, {
      features: [...(milestones.find(m => m.id === milestoneId)?.features || []), newFeature]
    });
    
    setEditingFeature({ milestoneId, featureId: newFeature.id });
    setExpandedFeature({ ...expandedFeature, [`${milestoneId}_${newFeature.id}`]: true });
  };

  const deleteFeature = (milestoneId, featureId) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    const feature = milestone?.features.find(f => f.id === featureId);
    setDeleteConfirmation({
      open: true,
      type: 'feature',
      target: { milestoneId, featureId },
      title: 'Delete Feature',
      message: `Are you sure you want to delete the feature "${feature?.topic || 'this feature'}"? This action will permanently remove all items within this feature and cannot be undone.`
    });
  };

  const confirmDeleteFeature = (milestoneId, featureId) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
      updateMilestone(milestoneId, {
        features: milestone.features.filter(f => f.id !== featureId)
      });
    }
    delete expandedFeature[`${milestoneId}_${featureId}`];
    setExpandedFeature({ ...expandedFeature });
    setDeleteConfirmation({ open: false, type: '', target: null, title: '', message: '' });
  };

  const updateFeature = (milestoneId, featureId, updates) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
      updateMilestone(milestoneId, {
        features: milestone.features.map(f => 
          f.id === featureId ? { ...f, ...updates } : f
        )
      });
    }
  };

  const addFeatureItem = (milestoneId, featureId) => {
    const newItem = {
      id: `item_${Date.now()}`,
      text: "",
      completed: false
    };
    
    const milestone = milestones.find(m => m.id === milestoneId);
    const feature = milestone?.features.find(f => f.id === featureId);
    
    if (feature) {
      updateFeature(milestoneId, featureId, {
        items: [...feature.items, newItem]
      });
      setEditingItem({ milestoneId, featureId, itemId: newItem.id });
    }
  };

  const deleteFeatureItem = (milestoneId, featureId, itemId) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    const feature = milestone?.features.find(f => f.id === featureId);
    const item = feature?.items.find(i => i.id === itemId);
    setDeleteConfirmation({
      open: true,
      type: 'item',
      target: { milestoneId, featureId, itemId },
      title: 'Delete Task Item',
      message: `Are you sure you want to delete the task item "${item?.text || 'this item'}"? This action cannot be undone.`
    });
  };

  const confirmDeleteFeatureItem = (milestoneId, featureId, itemId) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    const feature = milestone?.features.find(f => f.id === featureId);
    
    if (feature) {
      updateFeature(milestoneId, featureId, {
        items: feature.items.filter(i => i.id !== itemId)
      });
    }
    setDeleteConfirmation({ open: false, type: '', target: null, title: '', message: '' });
  };

  const updateFeatureItem = (milestoneId, featureId, itemId, updates) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    const feature = milestone?.features.find(f => f.id === featureId);
    
    if (feature) {
      updateFeature(milestoneId, featureId, {
        items: feature.items.map(i => 
          i.id === itemId ? { ...i, ...updates } : i
        )
      });
    }
  };

  const toggleFeatureExpansion = (milestoneId, featureId) => {
    const key = `${milestoneId}_${featureId}`;
    setExpandedFeature({
      ...expandedFeature,
      [key]: !expandedFeature[key]
    });
  };

  const handleClose = () => {
    setEditingMilestone(null);
    setEditingFeature(null);
    setEditingItem(null);
    setExpandedMilestone(null);
    setExpandedFeature({});
    setDeleteConfirmation({ open: false, type: '', target: null, title: '', message: '' });
    onClose();
  };

  const handleDeleteConfirm = () => {
    const { type, target } = deleteConfirmation;
    
    switch (type) {
      case 'milestone':
        confirmDeleteMilestone(target.milestoneId);
        break;
      case 'feature':
        confirmDeleteFeature(target.milestoneId, target.featureId);
        break;
      case 'item':
        confirmDeleteFeatureItem(target.milestoneId, target.featureId, target.itemId);
        break;
      default:
        setDeleteConfirmation({ open: false, type: '', target: null, title: '', message: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ open: false, type: '', target: null, title: '', message: '' });
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
                {project.name} - Manage project milestones and features
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: "grey.50" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : (
            <>
              {/* Add Milestone Button */}
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                p: 3,
              }}>
                <Typography variant="h6" sx={{ 
                  color: "primary.main", 
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
                  <TimelineIcon />
                  Milestones ({milestones.length})
                </Typography>
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
              </Box>

              {milestones.length === 0 ? (
                <Paper sx={{ 
                  p: 6, 
                  textAlign: "center", 
                  bgcolor: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                  borderRadius: 4,
                  border: "2px dashed",
                  borderColor: "grey.300",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                  <TimelineIcon sx={{ fontSize: 64, color: "grey.400", mb: 3 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                    No milestones yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>    
                    Create your first milestone to start tracking project progress.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Milestones help you organize features and track development progress effectively.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ spacing: 3, }}>
                  {milestones.map((milestone, index) => (
                    <Card key={milestone.id} sx={{ 
                      borderRadius: 3,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                      border: "1px solid",
                      borderColor: "grey.200",
                      overflow: "hidden",
                      mb: 1,
                      "&:hover": { 
                        boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                        transform: "translateY(-1px)",
                        transition: "all 0.3s ease"
                      }
                    }}>
                      <Accordion
                        expanded={expandedMilestone === milestone.id}
                        onChange={() => setExpandedMilestone(
                          expandedMilestone === milestone.id ? null : milestone.id
                        )}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            bgcolor: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                            borderRadius: "12px 12px 0 0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            "& .MuiAccordionSummary-content": {
                              alignItems: "center",
                              py: 1,
                            },
                            "&:hover": {
                              bgcolor: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                            <FlagIcon sx={{ color: "primary.main", fontSize: 24 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.dark" }}>
                              {milestone.name}
                            </Typography>
                            {milestone.title && (
                              <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                                {milestone.title}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                            {milestone.features.length > 0 && (
                              <Chip
                                label={`${milestone.features.length} Features`}
                                size="small"
                                sx={{pointerEvents: "none"}}
                                color="primary"
                                variant="outlined"
                                clickable={false}
                              />
                            )}
                            {milestone.startDate && milestone.endDate && (
                              <Chip
                                label={`${new Date(milestone.startDate).toLocaleDateString()} - ${new Date(milestone.endDate).toLocaleDateString()}`}
                                size="small"
                                sx={{pointerEvents: "none"}}
                                icon={<CalendarIcon />}
                                variant="outlined"
                                clickable={false}
                              />
                            )}
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails sx={{ p: 4, bgcolor: "grey.50", }}>
                          {editingMilestone === milestone.id ? (
                            // Edit Milestone Form
                            <Box sx={{ 
                              bgcolor: "white", 
                              p: 3, 
                              borderRadius: 3, 
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
                            }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Milestone Title"
                                    value={milestone.title}
                                    onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Milestone Name"
                                    value={milestone.name}
                                    onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
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
                                    onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <DatePicker
                                    label="Start Date"
                                    value={milestone.startDate ? new Date(milestone.startDate) : null}
                                    onChange={(date) => updateMilestone(milestone.id, { startDate: date })}
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
                                    value={milestone.endDate ? new Date(milestone.endDate) : null}
                                    onChange={(date) => updateMilestone(milestone.id, { endDate: date })}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                      },
                                    }}
                                    minDate={milestone.startDate ? new Date(milestone.startDate) : undefined}
                                  />
                                </Grid>
                              </Grid>
                              
                              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
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
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<CancelIcon />}
                                  onClick={() => setEditingMilestone(null)}
                                  sx={{ 
                                    borderRadius: 2,
                                    px: 3,
                                    borderWidth: 2,
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            // Display Milestone Details
                            <Box>
                              {milestone.description && (
                                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                                  {milestone.description}
                                </Typography>
                              )}

                              {/* Features Section */}
                              <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                  <Typography variant="h6" sx={{ 
                                    color: "primary.main", 
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1
                                  }}>
                                    <AssignmentIcon />
                                    Features to Implement ({milestone.features.length})
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => addFeature(milestone.id)}
                                    sx={{ 
                                      borderRadius: 2,
                                      px: 2,
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                                    }}
                                  >
                                    Add Feature
                                  </Button>
                                </Box>

                                {milestone.features.length === 0 ? (
                                  <Paper sx={{ 
                                    p: 2, 
                                    textAlign: "center", 
                                    bgcolor: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                    borderRadius: 3,
                                    border: "2px dashed",
                                    borderColor: "grey.300"
                                  }}>
                                    <AssignmentIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                                      No features added yet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Click "Add Feature" to get started with your milestone features.
                                    </Typography>
                                  </Paper>
                                ) : (
                                  <Box>
                                    {milestone.features.map((feature) => (
                                      <Card key={feature.id} sx={{ 
                                        mb: 3, 
                                        borderRadius: 3,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        overflow: "hidden",
                                        "&:hover": { 
                                          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                                          transform: "translateY(-1px)",
                                          transition: "all 0.3s ease"
                                        }
                                      }}>
                                        <CardContent sx={{ pb: 2 }}>
                                          <Box 
                                            sx={{ 
                                              display: "flex", 
                                              justifyContent: "space-between", 
                                              alignItems: "center", 
                                              mb: 2,
                                              cursor: "pointer",
                                              borderRadius: 2,
                                              transition: "all 0.2s ease-in-out",
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
                                                <TextField
                                                  fullWidth
                                                  size="small"
                                                  value={feature.topic}
                                                  onChange={(e) => updateFeature(milestone.id, feature.id, { topic: e.target.value })}
                                                  onBlur={() => setEditingFeature(null)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      setEditingFeature(null);
                                                    }
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  autoFocus
                                                  variant="outlined"
                                                  sx={{ 
                                                    "& .MuiOutlinedInput-root": {
                                                      borderRadius: 2
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                <Typography
                                                  variant="subtitle1"
                                                  sx={{ fontWeight: 600, flex: 1, color: "text.primary" }}
                                                >
                                                  {feature.topic || "Untitled Feature"}
                                                </Typography>
                                              )}
                                            </Box>
                                            
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                              <Tooltip title="Edit feature name">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingFeature({ milestoneId: milestone.id, featureId: feature.id });
                                                  }}
                                                  sx={{
                                                    color: "info.main",
                                                    "&:hover": { color: "info.dark" }
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
                                                    deleteFeature(milestone.id, feature.id);
                                                  }}
                                                  sx={{
                                                    color: "error.main",
                                                    "&:hover": { color: "error.dark" }
                                                  }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
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
                                                "0%": {
                                                  opacity: 0,
                                                  transform: "translateY(-10px)",
                                                  maxHeight: 0
                                                },
                                                "100%": {
                                                  opacity: 1,
                                                  transform: "translateY(0)",
                                                  maxHeight: "1000px"
                                                }
                                              }
                                            }}>
                                              <Box sx={{ 
                                                display: "flex", 
                                                justifyContent: "space-between", 
                                                alignItems: "center", 
                                                mb: 2,
                                                animation: "fadeIn 0.4s ease-out",
                                                "@keyframes fadeIn": {
                                                  "0%": {
                                                    opacity: 0
                                                  },
                                                  "100%": {
                                                    opacity: 1
                                                  }
                                                }
                                              }}>
                                                <Typography variant="body2" sx={{ 
                                                  color: "text.secondary",
                                                  fontWeight: 600,
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1
                                                }}>
                                                  <CheckCircleIcon fontSize="small" />
                                                  Task Items ({feature.items.length})
                                                </Typography>
                                                <Button
                                                  size="small"
                                                  variant="contained"
                                                  startIcon={<AddIcon />}
                                                  onClick={() => addFeatureItem(milestone.id, feature.id)}
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
                                              </Box>

                                              {feature.items.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ 
                                                  textAlign: "center", 
                                                  py: 3,
                                                  fontStyle: "italic"
                                                }}>
                                                  No task items yet. Click "Add Item" to create a checklist.
                                                </Typography>
                                              ) : (
                                                <List dense sx={{ 
                                                  bgcolor: "white", 
                                                  borderRadius: 2, 
                                                  p: 1,
                                                  "& .MuiListItem-root": {
                                                    animation: "fadeInUp 0.3s ease-out",
                                                    animationFillMode: "both"
                                                  },
                                                  "@keyframes fadeInUp": {
                                                    "0%": {
                                                      opacity: 0,
                                                      transform: "translateY(10px)"
                                                    },
                                                    "100%": {
                                                      opacity: 1,
                                                      transform: "translateY(0)"
                                                    }
                                                  }
                                                }}>
                                                  {feature.items.map((item, itemIndex) => (
                                                    <ListItem key={item.id} sx={{ 
                                                      px: 2,
                                                      py: 1,
                                                      mb: 1,
                                                      bgcolor: item.completed ? "success.50" : "grey.50",
                                                      borderRadius: 2,
                                                      border: "1px solid",
                                                      borderColor: item.completed ? "success.200" : "grey.200",
                                                      transition: "all 0.2s ease-in-out",
                                                      animationDelay: `${itemIndex * 0.05}s`,
                                                      "&:hover": {
                                                        bgcolor: item.completed ? "success.100" : "grey.100",
                                                        transform: "translateX(4px)",
                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                                      }
                                                    }}>
                                                      <FormControlLabel
                                                        control={
                                                          <Checkbox
                                                            checked={item.completed}
                                                            onChange={(e) => updateFeatureItem(
                                                              milestone.id, 
                                                              feature.id, 
                                                              item.id, 
                                                              { completed: e.target.checked }
                                                            )}
                                                            icon={<RadioButtonUncheckedIcon />}
                                                            checkedIcon={<CheckCircleIcon />}
                                                            sx={{
                                                              color: "success.main",
                                                              "&.Mui-checked": {
                                                                color: "success.main"
                                                              }
                                                            }}
                                                          />
                                                        }
                                                        label={
                                                          editingItem?.milestoneId === milestone.id && 
                                                          editingItem?.featureId === feature.id && 
                                                          editingItem?.itemId === item.id ? (
                                                            <TextField
                                                              size="small"
                                                              value={item.text}
                                                              onChange={(e) => updateFeatureItem(
                                                                milestone.id, 
                                                                feature.id, 
                                                                item.id, 
                                                                { text: e.target.value }
                                                              )}
                                                              onBlur={() => setEditingItem(null)}
                                                              onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                  setEditingItem(null);
                                                                }
                                                              }}
                                                              autoFocus
                                                              variant="standard"
                                                              sx={{ 
                                                                "& .MuiInput-underline:before": {
                                                                  borderBottomColor: "primary.main"
                                                                }
                                                              }}
                                                            />
                                                          ) : (
                                                            <Typography
                                                              variant="body2"
                                                              sx={{
                                                                textDecoration: item.completed ? "line-through" : "none",
                                                                color: item.completed ? "text.secondary" : "text.primary",
                                                                cursor: "pointer",
                                                                fontWeight: item.completed ? 400 : 500
                                                              }}
                                                              onClick={() => setEditingItem({
                                                                milestoneId: milestone.id,
                                                                featureId: feature.id,
                                                                itemId: item.id
                                                              })}
                                                            >
                                                              {item.text || "Click to add text"}
                                                            </Typography>
                                                          )
                                                        }
                                                        sx={{ flex: 1, mr: 1 }}
                                                      />
                                                      
                                                      <ListItemSecondaryAction>
                                                        <Tooltip title="Delete item">
                                                          <IconButton
                                                            size="small"
                                                            onClick={() => deleteFeatureItem(milestone.id, feature.id, item.id)}
                                                            sx={{
                                                              color: "error.main",
                                                              "&:hover": { color: "error.dark" }
                                                            }}
                                                          >
                                                            <DeleteIcon fontSize="small" />
                                                          </IconButton>
                                                        </Tooltip>
                                                      </ListItemSecondaryAction>
                                                    </ListItem>
                                                  ))}
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
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 4,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "white"
          }}
        >
          <Typography variant="body2" sx={{ 
            color: "text.secondary",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
            {milestones.length > 0 && (
              <>
                <TimelineIcon fontSize="small" />
                Total: {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
              </>
            )}
          </Typography>
          
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={saveMilestones}
              disabled={saveLoading}
              startIcon={saveLoading ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                "&:hover": { 
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.3)"
                }
              }}
            >
              Save Changes
            </Button>
            <Button 
              onClick={handleClose} 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": { borderWidth: 2 }
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

        <CustomSnackbar
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      </Dialog>
    </LocalizationProvider>
  );
};

export default ProjectMilestoneModal;
