"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Link as LinkIcon,
  GitHub as GitHubIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon,
  AdminPanelSettings as AdminIcon,
  TableChart as TableChartIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import DynamicBox from './DynamicBox';
import DebouncedTextField from './DebouncedTextField';

const ProjectRelatedInfoModal = ({ project, open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccessMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    githubPassword: false,
    githubToken: false,
    adminPassword: false,
  });
  const [editingBoxId, setEditingBoxId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [formData, setFormData] = useState({
    mondayBoardLink: "",
    ganttChartLink: "",
    issueListLink: "",
    sampleExcelSheetLink: "",
    timeSheetLink: "",
    github: {
      backendLink: "",
      frontendLink: "",
      email: "",
      uid: "",
      token: "",
      password: "",
      mainBranch: "main",
    },
    homePageLink: "",
    adminPanel: {
      link: "",
      email: "",
      password: "",
    },
    notes: "",
    dynamicBoxes: [],
  });

  // Memoize dynamic boxes to reduce re-renders
  const memoizedDynamicBoxes = useMemo(() => formData.dynamicBoxes, [formData.dynamicBoxes]);

  useEffect(() => {
    if (open && project) {
      fetchRelatedInfo();
    }
  }, [open, project]);

  const fetchRelatedInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const response = await fetch(`/api/projects/${project._id}/related-info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.relatedInfo) {
          // Merge with default values to ensure all fields are defined
          setFormData(prev => ({
            mondayBoardLink: data.relatedInfo.mondayBoardLink || "",
            ganttChartLink: data.relatedInfo.ganttChartLink || "",
            issueListLink: data.relatedInfo.issueListLink || "",
            sampleExcelSheetLink: data.relatedInfo.sampleExcelSheetLink || "",
            timeSheetLink: data.relatedInfo.timeSheetLink || "",
            github: {
              backendLink: data.relatedInfo.github?.backendLink || "",
              frontendLink: data.relatedInfo.github?.frontendLink || "",
              email: data.relatedInfo.github?.email || "",
              uid: data.relatedInfo.github?.uid || "",
              token: data.relatedInfo.github?.token || "",
              password: data.relatedInfo.github?.password || "",
              mainBranch: data.relatedInfo.github?.mainBranch || "main",
            },
            homePageLink: data.relatedInfo.homePageLink || "",
            adminPanel: {
              link: data.relatedInfo.adminPanel?.link || "",
              email: data.relatedInfo.adminPanel?.email || "",
              password: data.relatedInfo.adminPanel?.password || "",
            },
            notes: data.relatedInfo.notes || "",
            dynamicBoxes: data.relatedInfo.dynamicBoxes || [],
          }));
          // Remove the separate dynamic boxes state - use only formData
        }
      } else if (response.status !== 404) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch related info");
      }
    } catch (err) {
      console.error("Error fetching related info:", err);
      setError("Error fetching related info");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((field, value, subField = null) => {
    if (subField) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  }, []);

  const togglePasswordVisibility = (passwordField) => {
    setShowPasswords(prev => ({
      ...prev,
      [passwordField]: !prev[passwordField],
    }));
  };

  // Dynamic box functions - optimized with useCallback
  const showConfirmDialog = useCallback((title, message, onConfirm) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  }, []);

  const handleConfirmClose = useCallback(() => {
    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    handleConfirmClose();
  }, [confirmDialog.onConfirm, handleConfirmClose]);

  const addNewBox = useCallback(() => {
    const newBox = {
      id: Date.now().toString(),
      name: "New Box",
      fields: []
    };
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: [...prev.dynamicBoxes, newBox]
    }));
    setEditingBoxId(newBox.id);
  }, []);

  const updateBoxName = useCallback((boxId, newName) => {
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: prev.dynamicBoxes.map(box =>
        box.id === boxId ? { ...box, name: newName } : box
      )
    }));
  }, []);

  const deleteBox = useCallback((boxId) => {
    const box = formData.dynamicBoxes.find(b => b.id === boxId);
    const boxName = box?.name || "this box";
    
    showConfirmDialog(
      "Delete Box",
      `Are you sure you want to delete "${boxName}"? This will also delete all fields within this box. This action cannot be undone once clicked on save changes.`,
      () => {
        setFormData(prev => ({
          ...prev,
          dynamicBoxes: prev.dynamicBoxes.filter(box => box.id !== boxId)
        }));
      }
    );
  }, [formData.dynamicBoxes, showConfirmDialog]);

  const addFieldToBox = useCallback((boxId) => {
    const newField = {
      id: Date.now().toString(),
      label: "New Field",
      value: ""
    };
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: prev.dynamicBoxes.map(box =>
        box.id === boxId ? { ...box, fields: [...box.fields, newField] } : box
      )
    }));
  }, []);

  const updateFieldLabel = useCallback((boxId, fieldId, newLabel) => {
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: prev.dynamicBoxes.map(box =>
        box.id === boxId
          ? {
              ...box,
              fields: box.fields.map(field =>
                field.id === fieldId ? { ...field, label: newLabel } : field
              )
            }
          : box
      )
    }));
  }, []);

  const updateFieldValue = useCallback((boxId, fieldId, newValue) => {
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: prev.dynamicBoxes.map(box =>
        box.id === boxId
          ? {
              ...box,
              fields: box.fields.map(field =>
                field.id === fieldId ? { ...field, value: newValue } : field
              )
            }
          : box
      )
    }));
  }, []);

  const deleteField = useCallback((boxId, fieldId) => {
    const box = formData.dynamicBoxes.find(b => b.id === boxId);
    const field = box?.fields.find(f => f.id === fieldId);
    const fieldLabel = field?.label || "this field";
    
    showConfirmDialog(
      "Delete Field",
      `Are you sure you want to delete the field "${fieldLabel}"? This action cannot be undone once clicked on saved changes.`,
      () => {
        setFormData(prev => ({
          ...prev,
          dynamicBoxes: prev.dynamicBoxes.map(box =>
            box.id === boxId
              ? { ...box, fields: box.fields.filter(field => field.id !== fieldId) }
              : box
          )
        }));
      }
    );
  }, [formData.dynamicBoxes, showConfirmDialog]);

  const handleSave = async () => {
    setSaveLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      console.log("Saving formData:", formData);
      console.log("Dynamic boxes:", formData.dynamicBoxes);
      
      const token = getToken();
      const response = await fetch(`/api/projects/${project._id}/related-info`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ relatedInfo: formData }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Save response:", responseData);
        setSuccessMessage("Related info saved successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        console.error("Save error:", errorData);
        setError(errorData.error || "Failed to save related info");
      }
    } catch (err) {
      console.error("Error saving related info:", err);
      setError("Error saving related info");
    } finally {
      setSaveLoading(false);
      onClose();
    }
  };

  const handleClose = () => {
    if (saveLoading) return;
    setError("");
    setSuccessMessage("");
    setShowPasswords({
      githubPassword: false,
      githubToken: false,
      adminPassword: false,
    });
    setEditingBoxId(null);
    handleConfirmClose();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        borderBottom: "1px solid", 
        borderColor: "divider",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <InfoIcon color="primary" />
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Related Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project?.name} - Project Resources & Links
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={saveLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Project Management Tools */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DashboardIcon fontSize="small" color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    Project Management Tools
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Monday Board Link"
                      value={formData.mondayBoardLink}
                      onChange={(value) => handleInputChange("mondayBoardLink", value)}
                      placeholder="https://company.monday.com/boards/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <LinkIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Gantt Chart Link"
                      value={formData.ganttChartLink}
                      onChange={(value) => handleInputChange("ganttChartLink", value)}
                      placeholder="https://gantt.example.com/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <ScheduleIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Issue List Link"
                      value={formData.issueListLink}
                      onChange={(value) => handleInputChange("issueListLink", value)}
                      placeholder="https://issues.example.com/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <BugReportIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Time Sheet Link"
                      value={formData.timeSheetLink}
                      onChange={(value) => handleInputChange("timeSheetLink", value)}
                      placeholder="https://timesheet.example.com/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <ScheduleIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Sample Excel Sheet Link"
                      value={formData.sampleExcelSheetLink}
                      onChange={(value) => handleInputChange("sampleExcelSheetLink", value)}
                      placeholder="https://example.com/sample-sheet.xlsx"
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <TableChartIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* GitHub Information */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <GitHubIcon fontSize="small" color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    GitHub Repository Information
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Backend Repository Link"
                      value={formData.github.backendLink}
                      onChange={(value) => handleInputChange("github", value, "backendLink")}
                      placeholder="https://github.com/user/backend-repo"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="Frontend Repository Link"
                      value={formData.github.frontendLink}
                      onChange={(value) => handleInputChange("github", value, "frontendLink")}
                      placeholder="https://github.com/user/frontend-repo"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="GitHub Email"
                      value={formData.github.email}
                      onChange={(value) => handleInputChange("github", value, "email")}
                      placeholder="github@example.com"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="GitHub UID"
                      value={formData.github.uid}
                      onChange={(value) => handleInputChange("github", value, "uid")}
                      placeholder="GitHub User ID"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="GitHub Token"
                      type={showPasswords.githubToken ? "text" : "password"}
                      value={formData.github.token}
                      onChange={(value) => handleInputChange("github", value, "token")}
                      placeholder="GitHub Personal Access Token"
                      disabled={saveLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle token visibility"
                              onClick={() => togglePasswordVisibility("githubToken")}
                              edge="end"
                              disabled={saveLoading}
                            >
                              {showPasswords.githubToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DebouncedTextField
                      fullWidth
                      label="GitHub Password"
                      type={showPasswords.githubPassword ? "text" : "password"}
                      value={formData.github.password}
                      onChange={(value) => handleInputChange("github", value, "password")}
                      placeholder="GitHub Password"
                      disabled={saveLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => togglePasswordVisibility("githubPassword")}
                              edge="end"
                              disabled={saveLoading}
                            >
                              {showPasswords.githubPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <DebouncedTextField
                      fullWidth
                      label="Main Branch"
                      value={formData.github.mainBranch}
                      onChange={(value) => handleInputChange("github", value, "mainBranch")}
                      placeholder="main"
                      disabled={saveLoading}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Website & Admin Links */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <HomeIcon fontSize="small" color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    Website & Admin Access
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <DebouncedTextField
                      fullWidth
                      label="Home Page Link"
                      value={formData.homePageLink}
                      onChange={(value) => handleInputChange("homePageLink", value)}
                      placeholder="https://projectname.com"
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <HomeIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DebouncedTextField
                      fullWidth
                      label="Admin Panel Link"
                      value={formData.adminPanel.link}
                      onChange={(value) => handleInputChange("adminPanel", value, "link")}
                      placeholder="https://admin.projectname.com"
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <AdminIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DebouncedTextField
                      fullWidth
                      label="Admin Email"
                      value={formData.adminPanel.email}
                      onChange={(value) => handleInputChange("adminPanel", value, "email")}
                      placeholder="admin@projectname.com"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DebouncedTextField
                      fullWidth
                      label="Admin Password"
                      type={showPasswords.adminPassword ? "text" : "password"}
                      value={formData.adminPanel.password}
                      onChange={(value) => handleInputChange("adminPanel", value, "password")}
                      placeholder="Admin Panel Password"
                      disabled={saveLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => togglePasswordVisibility("adminPassword")}
                              edge="end"
                              disabled={saveLoading}
                            >
                              {showPasswords.adminPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Additional Notes */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main", mb: 2 }}>
                  Additional Notes
                </Typography>
                <DebouncedTextField
                  sx={{ width: "50vw" }}
                  multiline
                  rows={4}
                  label="Notes"
                  value={formData.notes}
                  onChange={(value) => handleInputChange("notes", value)}
                  placeholder="Add any additional information, credentials, or notes related to this project..."
                  disabled={saveLoading}
                />
              </Paper>
            </Grid>

            {/* Dynamic Boxes */}
            {memoizedDynamicBoxes.map((box) => (
              <DynamicBox
                key={box.id}
                box={box}
                editingBoxId={editingBoxId}
                setEditingBoxId={setEditingBoxId}
                updateBoxName={updateBoxName}
                addFieldToBox={addFieldToBox}
                deleteBox={deleteBox}
                updateFieldValue={updateFieldValue}
                updateFieldLabel={updateFieldLabel}
                deleteField={deleteField}
                saveLoading={saveLoading}
              />
            ))}

            {/* Add New Box Button */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addNewBox}
                  disabled={saveLoading}
                  sx={{ 
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    borderStyle: "dashed",
                    color: "primary.main",
                    borderColor: "primary.main",
                    "&:hover": {
                      backgroundColor: "primary.50",
                      borderStyle: "solid",
                    }
                  }}
                >
                  Add Another Box
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: "1px solid", 
        borderColor: "divider",
        gap: 2
      }}>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          disabled={saveLoading}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={saveLoading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={saveLoading || loading}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {saveLoading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DeleteIcon color="error" />
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography id="confirm-dialog-description">
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleConfirmClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ProjectRelatedInfoModal;
