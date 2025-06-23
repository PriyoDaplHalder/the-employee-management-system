"use client";

import { useState, useEffect } from "react";
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
  const [dynamicBoxes, setDynamicBoxes] = useState([]);
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

  useEffect(() => {
    if (open && project) {
      fetchRelatedInfo();
    }
  }, [open, project]);

  const fetchRelatedInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
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
          // Set dynamic boxes state
          setDynamicBoxes(data.relatedInfo.dynamicBoxes || []);
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

  const handleInputChange = (field, value, subField = null) => {
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
  };

  const togglePasswordVisibility = (passwordField) => {
    setShowPasswords(prev => ({
      ...prev,
      [passwordField]: !prev[passwordField],
    }));
  };

  // Dynamic box functions
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    handleConfirmClose();
  };

  const addNewBox = () => {
    const newBox = {
      id: Date.now().toString(),
      name: "New Box",
      fields: []
    };
    const updatedBoxes = [...dynamicBoxes, newBox];
    setDynamicBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: updatedBoxes
    }));
    setEditingBoxId(newBox.id);
  };

  const updateBoxName = (boxId, newName) => {
    const updatedBoxes = dynamicBoxes.map(box =>
      box.id === boxId ? { ...box, name: newName } : box
    );
    setDynamicBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: updatedBoxes
    }));
  };

  const deleteBox = (boxId) => {
    const box = dynamicBoxes.find(b => b.id === boxId);
    const boxName = box?.name || "this box";
    
    showConfirmDialog(
      "Delete Box",
      `Are you sure you want to delete "${boxName}"? This will also delete all fields within this box. This action cannot be undone once clicked on save changes.`,
      () => {
        const updatedBoxes = dynamicBoxes.filter(box => box.id !== boxId);
        setDynamicBoxes(updatedBoxes);
        setFormData(prev => ({
          ...prev,
          dynamicBoxes: updatedBoxes
        }));
      }
    );
  };

  const addFieldToBox = (boxId) => {
    const newField = {
      id: Date.now().toString(),
      label: "New Field",
      value: ""
    };
    const updatedBoxes = dynamicBoxes.map(box =>
      box.id === boxId ? { ...box, fields: [...box.fields, newField] } : box
    );
    setDynamicBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: updatedBoxes
    }));
  };

  const updateFieldLabel = (boxId, fieldId, newLabel) => {
    const updatedBoxes = dynamicBoxes.map(box =>
      box.id === boxId
        ? {
            ...box,
            fields: box.fields.map(field =>
              field.id === fieldId ? { ...field, label: newLabel } : field
            )
          }
        : box
    );
    setDynamicBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: updatedBoxes
    }));
  };

  const updateFieldValue = (boxId, fieldId, newValue) => {
    const updatedBoxes = dynamicBoxes.map(box =>
      box.id === boxId
        ? {
            ...box,
            fields: box.fields.map(field =>
              field.id === fieldId ? { ...field, value: newValue } : field
            )
          }
        : box
    );
    setDynamicBoxes(updatedBoxes);
    setFormData(prev => ({
      ...prev,
      dynamicBoxes: updatedBoxes
    }));
  };

  const deleteField = (boxId, fieldId) => {
    const box = dynamicBoxes.find(b => b.id === boxId);
    const field = box?.fields.find(f => f.id === fieldId);
    const fieldLabel = field?.label || "this field";
    
    showConfirmDialog(
      "Delete Field",
      `Are you sure you want to delete the field "${fieldLabel}"? This action cannot be undone once clicked on saved changes.`,
      () => {
        const updatedBoxes = dynamicBoxes.map(box =>
          box.id === boxId
            ? { ...box, fields: box.fields.filter(field => field.id !== fieldId) }
            : box
        );
        setDynamicBoxes(updatedBoxes);
        setFormData(prev => ({
          ...prev,
          dynamicBoxes: updatedBoxes
        }));
      }
    );
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      console.log("Saving formData:", formData);
      console.log("Dynamic boxes:", formData.dynamicBoxes);
      
      const token = localStorage.getItem("token");
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
                    <TextField
                      fullWidth
                      label="Monday Board Link"
                      value={formData.mondayBoardLink}
                      onChange={(e) => handleInputChange("mondayBoardLink", e.target.value)}
                      placeholder="https://company.monday.com/boards/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <LinkIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Gantt Chart Link"
                      value={formData.ganttChartLink}
                      onChange={(e) => handleInputChange("ganttChartLink", e.target.value)}
                      placeholder="https://gantt.example.com/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <ScheduleIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Issue List Link"
                      value={formData.issueListLink}
                      onChange={(e) => handleInputChange("issueListLink", e.target.value)}
                      placeholder="https://issues.example.com/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <BugReportIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Time Sheet Link"
                      value={formData.timeSheetLink}
                      onChange={(e) => handleInputChange("timeSheetLink", e.target.value)}
                      placeholder="https://timesheet.example.com/..."
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <ScheduleIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sample Excel Sheet Link"
                      value={formData.sampleExcelSheetLink}
                      onChange={(e) => handleInputChange("sampleExcelSheetLink", e.target.value)}
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
                    <TextField
                      fullWidth
                      label="Backend Repository Link"
                      value={formData.github.backendLink}
                      onChange={(e) => handleInputChange("github", e.target.value, "backendLink")}
                      placeholder="https://github.com/user/backend-repo"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Frontend Repository Link"
                      value={formData.github.frontendLink}
                      onChange={(e) => handleInputChange("github", e.target.value, "frontendLink")}
                      placeholder="https://github.com/user/frontend-repo"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GitHub Email"
                      value={formData.github.email}
                      onChange={(e) => handleInputChange("github", e.target.value, "email")}
                      placeholder="github@example.com"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GitHub UID"
                      value={formData.github.uid}
                      onChange={(e) => handleInputChange("github", e.target.value, "uid")}
                      placeholder="GitHub User ID"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GitHub Token"
                      type={showPasswords.githubToken ? "text" : "password"}
                      value={formData.github.token}
                      onChange={(e) => handleInputChange("github", e.target.value, "token")}
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
                    <TextField
                      fullWidth
                      label="GitHub Password"
                      type={showPasswords.githubPassword ? "text" : "password"}
                      value={formData.github.password}
                      onChange={(e) => handleInputChange("github", e.target.value, "password")}
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
                    <TextField
                      fullWidth
                      label="Main Branch"
                      value={formData.github.mainBranch}
                      onChange={(e) => handleInputChange("github", e.target.value, "mainBranch")}
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
                    <TextField
                      fullWidth
                      label="Home Page Link"
                      value={formData.homePageLink}
                      onChange={(e) => handleInputChange("homePageLink", e.target.value)}
                      placeholder="https://projectname.com"
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <HomeIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Admin Panel Link"
                      value={formData.adminPanel.link}
                      onChange={(e) => handleInputChange("adminPanel", e.target.value, "link")}
                      placeholder="https://admin.projectname.com"
                      disabled={saveLoading}
                      InputProps={{
                        startAdornment: <AdminIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Admin Email"
                      value={formData.adminPanel.email}
                      onChange={(e) => handleInputChange("adminPanel", e.target.value, "email")}
                      placeholder="admin@projectname.com"
                      disabled={saveLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Admin Password"
                      type={showPasswords.adminPassword ? "text" : "password"}
                      value={formData.adminPanel.password}
                      onChange={(e) => handleInputChange("adminPanel", e.target.value, "password")}
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
                <TextField
                  sx={{ width: "50vw" }}
                  multiline
                  rows={4}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Add any additional information, credentials, or notes related to this project..."
                  disabled={saveLoading}
                />
              </Paper>
            </Grid>

            {/* Dynamic Boxes */}
            {dynamicBoxes.map((box) => (
              <Grid item xs={12} key={box.id}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    {editingBoxId === box.id ? (
                      <TextField
                        variant="outlined"
                        size="small"
                        value={box.name}
                        onChange={(e) => updateBoxName(box.id, e.target.value)}
                        onBlur={() => setEditingBoxId(null)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setEditingBoxId(null);
                          }
                        }}
                        autoFocus
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                          {box.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setEditingBoxId(box.id)}
                          disabled={saveLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addFieldToBox(box.id)}
                        disabled={saveLoading}
                        sx={{ borderRadius: 2 }}
                      >
                        Add Field
                      </Button>
                      <IconButton
                        color="error"
                        onClick={() => deleteBox(box.id)}
                        disabled={saveLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {box.fields.map((field) => (
                      <Grid item xs={12} sm={6} key={field.id}>
                        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                          <TextField
                            fullWidth
                            label={field.label}
                            value={field.value}
                            onChange={(e) => updateFieldValue(box.id, field.id, e.target.value)}
                            disabled={saveLoading}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const newLabel = prompt("Enter new label:", field.label);
                                      if (newLabel && newLabel.trim()) {
                                        updateFieldLabel(box.id, field.id, newLabel.trim());
                                      }
                                    }}
                                    disabled={saveLoading}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                          <IconButton
                            color="error"
                            onClick={() => deleteField(box.id, field.id)}
                            disabled={saveLoading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                    {box.fields.length === 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                          No fields added yet. Click "Add Field" to create input fields.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
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
