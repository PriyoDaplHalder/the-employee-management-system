"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";

const MailMappings = ({ user, onBack }) => {
  const [mounted, setMounted] = useState(false);
  const [positionMappings, setPositionMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);

  // Position and employee data
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    position: "",
    employeeName: "",
    email: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchPositionMappings();
    fetchPositions();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const fetchPositions = async () => {
    try {
      setPositionsLoading(true);
      const token = getToken();
      const response = await fetch("/api/management/positions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data = await response.json();
      setPositions(data.positions || []);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setPositionsLoading(false);
    }
  };

  const fetchPositionMappings = async () => {
    try {
      setLoading(true); // Always show loading when fetching
      // console.log("Fetching position mappings...");
      const token = getToken();

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/management/position-emails?t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch position email mappings");
      }

      const data = await response.json();
      // console.log("Fetched position mappings:", data.mappings);
      setPositionMappings(data.mappings || []);
    } catch (err) {
      console.error("Error fetching position mappings:", err);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      position: "",
      employeeName: "",
      email: "",
      description: "",
    });
  };

  const handleAddMapping = async () => {
    if (!formData.position || !formData.employeeName || !formData.email) {
      setSnackbar({
        open: true,
        message: "Position, employee name, and email are required",
        severity: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch("/api/management/position-emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Position email mapping created successfully",
          severity: "success",
        });
        setShowAddModal(false);
        resetForm();
        setRefreshTrigger((prev) => prev + 1); // Trigger refresh
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Failed to create position email mapping",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMapping = async () => {
    if (!formData.position || !formData.employeeName || !formData.email) {
      setSnackbar({
        open: true,
        message: "Position, employee name, and email are required",
        severity: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch("/api/management/position-emails", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedMapping._id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Position email mapping updated successfully",
          severity: "success",
        });
        setShowEditModal(false);
        setSelectedMapping(null);
        resetForm();
        setRefreshTrigger((prev) => prev + 1); // Trigger refresh
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Failed to update position email mapping",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMapping = async () => {
    setActionLoading(true);
    try {
      console.log("Deleting mapping:", selectedMapping);
      const token = getToken();

      // Optimistically remove from UI first
      const mappingIdToDelete = selectedMapping._id;
      setPositionMappings((prev) =>
        prev.filter((mapping) => mapping._id !== mappingIdToDelete)
      );

      const response = await fetch(
        `/api/management/position-emails/${mappingIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      console.log("Delete response status:", response.status);
      const responseData = await response.json();
      console.log("Delete response data:", responseData);

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Position email mapping deleted successfully",
          severity: "success",
        });
        setShowDeleteDialog(false);
        setSelectedMapping(null);

        // Force refresh from server to ensure consistency
        console.log("Triggering refresh after successful delete...");
        setRefreshTrigger((prev) => prev + 1);
      } else {
        console.error("Delete failed:", responseData);
        // Revert optimistic update on failure
        setRefreshTrigger((prev) => prev + 1);
        setSnackbar({
          open: true,
          message:
            responseData.error || "Failed to delete position email mapping",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      // Revert optimistic update on error
      setRefreshTrigger((prev) => prev + 1);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (mapping) => {
    setSelectedMapping(mapping);

    setFormData({
      position: mapping.position,
      employeeName: mapping.employeeName,
      email: mapping.email,
      description: mapping.description || "",
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (mapping) => {
    setSelectedMapping(mapping);
    setShowDeleteDialog(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "80vh", bgcolor: "grey.100" }}>
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
            Position Email Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Add Position Email
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Position Mappings Table */}
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : positionMappings.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Position Email Mappings Found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Start by adding position-based email addresses for your
                  organization.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  Add First Position Email
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.main" }}>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }}>Position</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }}>Employee Name</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }}>Email Address</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }}>Description</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }}>Created By</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }}>Created Date</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "Bold" }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {positionMappings.map((mapping) => (
                      <TableRow key={mapping._id} hover>
                        <TableCell>
                          <Chip
                            label={mapping.position}
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{ pointerEvents: "none" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mapping.employeeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mapping.email}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 200,
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                              display: "block",
                            }}
                          >
                            {mapping.description || "No description"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mapping.createdBy?.firstName}{" "}
                            {mapping.createdBy?.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(mapping.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => openEditModal(mapping)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => openDeleteDialog(mapping)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Add Position Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Position Email Mapping</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl sx={{ width: "25vw" }} required>
                  <InputLabel>Position</InputLabel>
                  <Select
                    name="position"
                    value={formData.position}
                    onChange={handleFormChange}
                    label="Position"
                    disabled={positionsLoading}
                  >
                    {positionsLoading ? (
                      <MenuItem disabled>Loading positions...</MenuItem>
                    ) : positions.length === 0 ? (
                      <MenuItem disabled>No positions available</MenuItem>
                    ) : (
                      positions.map((positionGroup) => (
                        <MenuItem
                          key={positionGroup.position}
                          value={positionGroup.position}
                        >
                          {positionGroup.position} (
                          {positionGroup.employees.length} employees)
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {formData.position && (
                <Grid item xs={12}>
                  <FormControl sx={{ width: "30vw" }} required>
                    <InputLabel>Employee Name</InputLabel>
                    <Select
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        const selectedEmployee = positions
                          .find((p) => p.position === formData.position)
                          ?.employees.find((emp) => emp.name === selectedValue);

                        setFormData((prev) => ({
                          ...prev,
                          employeeName: selectedValue,
                          email: selectedEmployee?.email || prev.email,
                        }));
                      }}
                      label="Employee Name"
                    >
                      {positions
                        .find((p) => p.position === formData.position)
                        ?.employees.map((employee) => (
                          <MenuItem key={employee._id} value={employee.name}>
                            {employee.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g., hr@company.com"
                  required
                  helperText="This may be different from the employee's regular email as it's the position-specific email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Brief description of this position email mapping"
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowAddModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMapping}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : "Add Position"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Position Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Position Email Mapping</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl sx={{ width: "30vw" }} required>
                  <InputLabel>Position</InputLabel>
                  <Select
                    name="position"
                    value={formData.position}
                    onChange={handleFormChange}
                    label="Position"
                    disabled={positionsLoading}
                  >
                    {positionsLoading ? (
                      <MenuItem disabled>Loading positions...</MenuItem>
                    ) : positions.length === 0 ? (
                      <MenuItem disabled>No positions available</MenuItem>
                    ) : (
                      positions.map((positionGroup) => (
                        <MenuItem
                          key={positionGroup.position}
                          value={positionGroup.position}
                        >
                          {positionGroup.position} (
                          {positionGroup.employees.length} employees)
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {formData.position && (
                <Grid item xs={12}>
                  <FormControl sx={{ width: "30vw" }} required>
                    <InputLabel>Employee Name</InputLabel>
                    <Select
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          employeeName: selectedValue,
                        }));
                      }}
                      label="Employee Name"
                    >
                      {positions
                        .find((p) => p.position === formData.position)
                        ?.employees.map((employee) => (
                          <MenuItem key={employee._id} value={employee.name}>
                            {employee.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  helperText="This may be different from the employee's regular email as it's the position-specific email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                sx={{ width: "35vw" }}
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleFormChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowEditModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditMapping}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : "Update Position"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Position Email Mapping</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the position email mapping for "
            {selectedMapping?.position}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowDeleteDialog(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteMapping}
            variant="contained"
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default MailMappings;
