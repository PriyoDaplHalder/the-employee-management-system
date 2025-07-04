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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Mail as MailIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Subject as SubjectIcon,
  Message as MessageIcon,
  Group as GroupIcon,
  CopyAll as CopyIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";

const MailManagement = ({ user, onBack }) => {
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [userDepartment, setUserDepartment] = useState(null);
  const [mailHistory, setMailHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Form states
  const [formData, setFormData] = useState({
    requestType: "",
    subject: "",
    message: "",
    selectedDepartment: "",
    selectedPosition: null,
    ccPositions: [],
    priority: "Medium",
  });

  // Modal state
  const [selectedMail, setSelectedMail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const requestTypes = [
    "Leave Application",
    "Work from Home",
    "General Request",
    "Others",
  ];

  const priorities = ["Low", "Medium", "High"];

  useEffect(() => {
    setMounted(true);
    fetchAvailablePositions();
    fetchAvailableDepartments();
    fetchUserDepartment();
    fetchMailHistory();
  }, []);

  const fetchAvailableDepartments = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/mail/departments", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch available departments");
      }

      const data = await response.json();
      setAvailableDepartments(data.departments || []);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    }
  };

  const fetchUserDepartment = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/employee/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const employeeData = await response.json();
        setUserDepartment(employeeData.department);

        // Auto-select user's department if they are an employee
        if (user?.role === "employee" && employeeData.department) {
          setFormData((prev) => ({
            ...prev,
            selectedDepartment: employeeData.department,
          }));
        }
      }
    } catch (err) {
      console.log("Could not fetch user department:", err.message);
      // Don't show error for this as it's not critical
    }
  };

  const fetchAvailablePositions = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/mail?action=get-positions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch available positions");
      }

      const data = await response.json();
      setAvailablePositions(data.positions || []);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    }
  };

  const fetchMailHistory = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/mail", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch mail history");
      }

      const data = await response.json();
      setMailHistory(data.mails || []);
    } catch (err) {
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
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: value,
      };

      // If department changes, clear position selections
      if (name === "selectedDepartment") {
        newFormData.selectedPosition = null;
        newFormData.ccPositions = [];
      }

      return newFormData;
    });
  };

  const handlePositionChange = (field, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const resetForm = () => {
    setFormData({
      requestType: "",
      subject: "",
      message: "",
      selectedDepartment: "",
      selectedPosition: null,
      ccPositions: [],
      priority: "Medium",
    });
  };

  const handleSendMail = async () => {
    if (
      !formData.requestType ||
      !formData.subject ||
      !formData.message ||
      !formData.selectedDepartment ||
      !formData.selectedPosition
    ) {
      setSnackbar({
        open: true,
        message:
          "Please fill in all required fields including department and recipient position",
        severity: "error",
      });
      return;
    }

    setSending(true);
    try {
      const token = getToken();

      // Extract position IDs from selected position objects
      const requestData = {
        ...formData,
        selectedPositions: [formData.selectedPosition._id], // Convert single position to array for backend compatibility
        ccPositions: formData.ccPositions.map((pos) => pos._id),
        selectedDepartment: formData.selectedDepartment || null, // Include department filter
      };

      const response = await fetch("/api/mail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        let successMessage = "Mail sent successfully!";
        if (data.emailResults) {
          const { sent = 0, failed = 0 } = data.emailResults;
          if (sent > 0 && failed === 0) {
            successMessage += ` Email delivered to ${sent} role(s).`;
          } else if (sent > 0 && failed > 0) {
            successMessage += ` Email delivered to ${sent} role(s), ${failed} failed.`;
          } else if (failed > 0) {
            successMessage += ` Warning: Email delivery failed for ${failed} role(s).`;
          }
        }
        setSnackbar({
          open: true,
          message: successMessage,
          severity: "success",
        });
        resetForm();
        fetchMailHistory();
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Failed to send mail",
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
      setSending(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const openMailDetail = (mail) => {
    setSelectedMail(mail);
    setShowDetailModal(true);
  };

  const closeMailDetail = () => {
    setSelectedMail(null);
    setShowDetailModal(false);
  }; // Helper function to get filtered positions based on selected department
  const getFilteredPositions = () => {
    if (!formData.selectedDepartment) {
      return [];
    }

    // Find the selected department and return its positions
    const selectedDept = availableDepartments.find(
      (dept) => dept.department === formData.selectedDepartment
    );

    return selectedDept ? selectedDept.positions : [];
  };

  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
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
            Internal Mail System
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<SendIcon />} label="Send Mail" iconPosition="start" />
            <Tab
              icon={<HistoryIcon />}
              label="Mail History"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Send Mail Tab */}
        {currentTab === 0 && (
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <MailIcon color="primary" />
              <Typography variant="h6" color="primary.main">
                Compose Internal Request
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Department-Based Mailing:</strong> First select a
                department to unlock position selection. Once a department is
                chosen, you can select the specific position within that
                department and optionally add CC positions. This ensures your
                mail reaches only the intended recipients in the right
                department.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl sx={{ width: "15vw" }} required>
                  <InputLabel>Request Type</InputLabel>
                  <Select
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleFormChange}
                    label="Request Type"
                  >
                    {requestTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    label="Priority"
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  sx={{ width: "40vw" }}
                  name="subject"
                  label="Subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  placeholder="Brief description of your request"
                  required
                />
              </Grid>

              {/* Department Selection - Required First */}
              <Grid item xs={12}>
                <FormControl sx={{ minWidth: "20vw" }} required>
                  <InputLabel>Department *</InputLabel>
                  <Select
                    name="selectedDepartment"
                    value={formData.selectedDepartment}
                    onChange={handleFormChange}
                    label="Department *"
                  >
                    {availableDepartments.map((dept) => (
                      <MenuItem key={dept._id} value={dept.department}>
                        {dept.department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Show message when no department selected */}
              {!formData.selectedDepartment && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Please select a department above to see available
                      positions for that department.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Position and CC fields - Only show when department is selected */}
              {formData.selectedDepartment && (
                <>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getFilteredPositions()}
                      getOptionLabel={(option) => option.position}
                      value={formData.selectedPosition}
                      onChange={(event, newValue) =>
                        handlePositionChange("selectedPosition", newValue)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Send To Position (Required)"
                          placeholder="Select position to send to"
                          required={!formData.selectedPosition}
                          helperText={`Positions available in ${formData.selectedDepartment} department`}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      multiple
                      options={getFilteredPositions().filter(
                        (pos) =>
                          !formData.selectedPosition ||
                          pos._id !== formData.selectedPosition._id
                      )}
                      getOptionLabel={(option) => option.position}
                      value={formData.ccPositions}
                      onChange={(event, newValue) =>
                        handlePositionChange("ccPositions", newValue)
                      }
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option.position}
                            {...getTagProps({ index })}
                            key={option._id}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="CC Positions (Optional)"
                          placeholder="Select positions to CC"
                          helperText={`CC positions from ${formData.selectedDepartment} department`}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  sx={{ minWidth: "66vw" }}
                  fullWidth
                  name="message"
                  label="Message"
                  value={formData.message}
                  onChange={handleFormChange}
                  placeholder="Provide detailed information about your request..."
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                >
                  <Button
                    onClick={resetForm}
                    disabled={sending}
                    sx={{ minWidth: 100 }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSendMail}
                    variant="contained"
                    startIcon={
                      sending ? <CircularProgress size={20} /> : <SendIcon />
                    }
                    disabled={sending}
                    sx={{ minWidth: 120 }}
                  >
                    {sending ? "Sending..." : "Send Mail"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Mail History Tab */}
        {currentTab === 1 && (
          <Paper elevation={2} sx={{ borderRadius: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Mail History
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>About Department-Based Mailing:</strong> All mails are
                  sent to specific positions within selected departments. When
                  you send a mail to "HR Manager" in the "Development"
                  department, it goes only to HR Managers in that specific
                  department. This allows precise targeting while maintaining
                  the flexibility of position-based mailing when employees
                  change roles within departments.
                </Typography>
              </Alert>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : mailHistory.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <MailIcon
                    sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Mails Sent Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your sent mail history will appear here.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Request Type</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Sent To Positions</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mailHistory.map((mail) => (
                        <TableRow key={mail._id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(mail.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(mail.createdAt).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mail.requestType}
                              color="primary"
                              variant="outlined"
                              size="small"
                              sx={{ pointerEvents: "none" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {mail.subject}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {mail.selectedDepartment ? (
                              <Chip
                                label={mail.selectedDepartment}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ pointerEvents: "none" }}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Not specified
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                              }}
                            >
                              {[
                                ...new Set(
                                  mail.recipients.map(
                                    (recipient) => recipient.position
                                  )
                                ),
                              ].map((position, index) => (
                                <Chip
                                  key={index}
                                  sx={{
                                    pointerEvents: "none",
                                    alignSelf: "flex-start",
                                  }}
                                  label={position}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                              {mail.ccRecipients &&
                                mail.ccRecipients.length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                  >
                                    CC:{" "}
                                    {[
                                      ...new Set(
                                        mail.ccRecipients.map(
                                          (cc) => cc.position
                                        )
                                      ),
                                    ].join(", ")}
                                  </Typography>
                                )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mail.priority}
                              color={
                                mail.priority === "High"
                                  ? "error"
                                  : mail.priority === "Medium"
                                  ? "warning"
                                  : "default"
                              }
                              sx={{ pointerEvents: "none" }}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                              }}
                            >
                              <Chip
                                label={mail.status}
                                color={
                                  mail.status === "Sent" ? "success" : "default"
                                }
                                size="small"
                                sx={{ pointerEvents: "none" }}
                              />
                              {mail.emailStatus && (
                                <Chip
                                  label={`Email: ${mail.emailStatus}`}
                                  color={
                                    mail.emailStatus === "Sent"
                                      ? "success"
                                      : mail.emailStatus === "Partially Sent"
                                      ? "warning"
                                      : mail.emailStatus === "Failed"
                                      ? "error"
                                      : "default"
                                  }
                                  size="small"
                                  variant="outlined"
                                  sx={{ pointerEvents: "none" }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.70rem" }}
                              onClick={() => openMailDetail(mail)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        )}
      </Container>

      {/* Mail Detail Modal */}
      <Dialog
        open={showDetailModal}
        onClose={closeMailDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MailIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Mail Details
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedMail && (
            <Box>
              {/* Subject and Message */}
              <Box sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: "text.primary",
                    borderLeft: 3,
                    borderColor: "primary.main",
                    pl: 2,
                  }}
                >
                  {selectedMail.subject}
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: "grey.50",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      color: "text.primary",
                    }}
                  >
                    {selectedMail.message}
                  </Typography>
                </Paper>
              </Box>

              {/* Mail Info */}
              <Box
                sx={{
                  px: 3,
                  pt: 2.5,
                  bgcolor: "grey.50",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Grid container spacing={2.5}>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Request Type
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedMail.requestType}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ pointerEvents: "none" }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Priority
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedMail.priority}
                        size="small"
                        sx={{ pointerEvents: "none" }}
                        color={
                          selectedMail.priority === "High"
                            ? "error"
                            : selectedMail.priority === "Medium"
                            ? "warning"
                            : "default"
                        }
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Department
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedMail.selectedDepartment ? (
                        <Chip
                          label={selectedMail.selectedDepartment}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ pointerEvents: "none" }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.9rem" }}
                        >
                          Not specified
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Sent To
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontSize: "0.9rem" }}
                    >
                      {[
                        ...new Set(
                          selectedMail.recipients?.map(
                            (recipient) => recipient.position
                          ) || []
                        ),
                      ].join(", ")}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Date
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontSize: "0.9rem" }}
                    >
                      {new Date(selectedMail.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(selectedMail.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Grid>

                  {selectedMail.ccRecipients &&
                    selectedMail.ccRecipients.length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          CC Recipients
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, fontSize: "0.9rem" }}
                        >
                          {[
                            ...new Set(
                              selectedMail.ccRecipients.map((cc) => cc.position)
                            ),
                          ].join(", ")}
                        </Typography>
                      </Grid>
                    )}
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={closeMailDetail}
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            Close
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

export default MailManagement;
