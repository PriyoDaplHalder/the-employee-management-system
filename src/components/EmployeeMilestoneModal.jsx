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
  Card,
  CardContent,
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

  const project = assignment?.projectId;

  useEffect(() => {
    if (open && project) {
      fetchMilestones();
    }
  }, [open, project]);

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

  const updateTaskItemCompletion = async (milestoneId, featureId, itemId, completed) => {
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
      setSnackbar({
        open: true,
        message: err.message,
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

  const handleClose = () => {
    setExpandedMilestone(null);
    setExpandedFeature({});
    setExpandedNote({});
    onClose();
  };

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
              <Typography variant="body2" color="text.secondary">
                {project.name} - Read Only View
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
                  label="Read Only"
                  variant="outlined"
                  color="info"
                  sx={{ fontWeight: 600, pointerEvents: "none" }}
                />
              </Box>

              {milestones.length === 0 ? (
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
                    No Milestones Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    This project doesn't have any milestones set up yet.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {milestones.map((milestone) => (
                    <Card
                      key={milestone.id}
                      sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      <Accordion
                        expanded={expandedMilestone === milestone.id}
                        onChange={() =>
                          setExpandedMilestone(
                            expandedMilestone === milestone.id ? null : milestone.id
                          )
                        }
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
                        <AccordionDetails sx={{ p: 4, bgcolor: "grey.50" }}>
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
                              <AssignmentIcon />
                              Features ({milestone.features.length})
                            </Typography>

                            {milestone.features.length === 0 ? (
                              <Paper
                                sx={{
                                  p: 3,
                                  textAlign: "center",
                                  bgcolor: "white",
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
                                >
                                  No Features Yet
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  This milestone doesn't have any features defined.
                                </Typography>
                              </Paper>
                            ) : (
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {milestone.features.map((feature) => (
                                  <Card key={feature.id} sx={{ borderRadius: 2 }}>
                                    <CardContent sx={{ p: 0, pb: "0!important" }}>
                                      <Box
                                        sx={{
                                          p: 2,
                                          bgcolor: "primary.50",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          cursor: "pointer",
                                          borderRadius: 2,
                                          transition: "all 0.2s ease-in-out",
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
                                          <Typography
                                            variant="subtitle1"
                                            sx={{
                                              fontWeight: 600,
                                              flex: 1,
                                              color: "text.primary",
                                            }}
                                          >
                                            {feature.topic || "Untitled Feature"}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={`${feature.items.length} Items`}
                                          size="small"
                                          variant="outlined"
                                          sx={{ pointerEvents: "none" }}
                                        />
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
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              mb: 2,
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
                                              Task Items ({feature.items.length})
                                            </Typography>
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
                                              No task items available.
                                            </Typography>
                                          ) : (
                                            <List
                                              dense
                                              sx={{
                                                bgcolor: "white",
                                                borderRadius: 2,
                                                p: 1,
                                                mb: 2,
                                              }}
                                            >
                                              {feature.items.map((item, itemIndex) => (
                                                <ListItem
                                                  key={item.id}
                                                  sx={{
                                                    px: 2,
                                                    py: 1,
                                                    mb: 1,
                                                    bgcolor: item.completed
                                                      ? "success.50"
                                                      : "grey.50",
                                                    borderRadius: 2,
                                                    border: "1px solid",
                                                    borderColor: item.completed
                                                      ? "success.200"
                                                      : "grey.200",
                                                    transition: "all 0.2s ease-in-out",
                                                    "&:hover": {
                                                      bgcolor: item.completed
                                                        ? "success.100"
                                                        : "grey.100",
                                                      transform: "translateX(4px)",
                                                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                    },
                                                  }}
                                                >
                                                  <FormControlLabel
                                                    control={
                                                      <Checkbox
                                                        checked={item.completed}
                                                        onChange={(e) => {
                                                          // Only allow if assigned to this user
                                                          if (item.assignedTo && String(item.assignedTo) === String(user?.id)) {
                                                            updateTaskItemCompletion(
                                                              milestone.id,
                                                              feature.id,
                                                              item.id,
                                                              e.target.checked
                                                            );
                                                          }
                                                        }}
                                                        // Disable if unassigned or assigned to someone else
                                                        disabled={!item.assignedTo || String(item.assignedTo) !== String(user?.id)}
                                                        icon={<RadioButtonUncheckedIcon />}
                                                        checkedIcon={<CheckCircleIcon />}
                                                        sx={{
                                                          color: "success.main",
                                                          "&.Mui-checked": {
                                                            color: "success.main",
                                                          },
                                                          "&.Mui-disabled": {
                                                            color: "grey.400",
                                                          },
                                                        }}
                                                      />
                                                    }
                                                    label={
                                                      <Box sx={{ width: "100%" }}>
                                                        <Typography
                                                          variant="body2"
                                                          sx={{
                                                            textDecoration: item.completed
                                                              ? "line-through"
                                                              : "none",
                                                            color: item.completed
                                                              ? "text.secondary"
                                                              : "text.primary",
                                                            fontWeight: item.completed
                                                              ? 400
                                                              : 500,
                                                          }}
                                                        >
                                                          {item.text || "No description"}
                                                        </Typography>
                                                        {/* Assignment Status */}
                                                        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                          {item.assignedTo ? (
                                                            <>
                                                              <Chip
                                                                size="small"
                                                                label={
                                                                  String(item.assignedTo) === String(user?.id)
                                                                    ? "Assigned to you"
                                                                    : "Assigned to other"
                                                                }
                                                                color={String(item.assignedTo) === String(user?.id) ? "primary" : "default"}
                                                                variant="outlined"
                                                                sx={{ fontSize: "0.7rem", pointerEvents: "none" }}
                                                              />
                                                              {item.dueDate && (
                                                                <Chip
                                                                  size="small"
                                                                  label={`Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                                                                  color={
                                                                    new Date(item.dueDate) < new Date() && !item.completed
                                                                      ? "error"
                                                                      : "warning"
                                                                  }
                                                                  variant="outlined"
                                                                  sx={{ fontSize: "0.7rem" }}
                                                                />
                                                              )}
                                                            </>
                                                          ) : (
                                                            <Chip
                                                              size="small"
                                                              label="No assignment"
                                                              color="default"
                                                              variant="outlined"
                                                              sx={{ fontSize: "0.7rem", pointerEvents: "none" }}
                                                            />
                                                          )}
                                                        </Box>
                                                      </Box>
                                                    }
                                                    sx={{ flex: 1, mr: 1 }}
                                                  />
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
                        </AccordionDetails>
                      </Accordion>
                    </Card>
                  ))}
                </Box>
              )}

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
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {notes.map((note) => (
                      <Card
                        key={note.id}
                        sx={{
                          borderRadius: 3,
                          overflow: "hidden",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
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
                              bgcolor: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                              borderRadius: "12px 12px 0 0",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              "& .MuiAccordionSummary-content": {
                                alignItems: "center",
                                py: 1,
                              },
                              "&:hover": {
                                bgcolor: "linear-gradient(135deg, #ffecb3 0%, #ffd54f 100%)",
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
                              <Typography
                                variant="h6"
                                sx={{ 
                                  fontWeight: 700, 
                                  color: "warning.dark",
                                }}
                              >
                                {note.title || "Untitled Note"}
                              </Typography>
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
                              <Chip
                                label="Read Only"
                                size="small"
                                variant="outlined"
                                color="info"
                                sx={{ pointerEvents: "none" }}
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 3, bgcolor: "grey.50" }}>
                            {note.description ? (
                              <Typography
                                variant="body1"
                                sx={{
                                  lineHeight: 1.7,
                                  color: "text.primary",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {note.description}
                              </Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  textAlign: "center",
                                  py: 2,
                                  fontStyle: "italic",
                                }}
                              >
                                No description available for this note.
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
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
                    {notes.length} note{notes.length !== 1 ? "s" : ""}
                  </>
                )}
              </>
            )}
          </Typography>

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
