"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Mail as MailIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";
import MailComposeForm from "./MailComposeForm";
import MailHistoryTable from "./MailHistoryTable";
import MailDetailModal from "./MailDetailModal";

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
    // Leave specific fields
    leaveType: "",
    fromDate: "",
    fromSession: "first",
    toDate: "",
    toSession: "second",
    // Work from Home specific fields
    wfhFromDate: "",
    wfhToDate: "",
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

  const leaveTypes = ["Loss of Pay", "Comp-off", "Paid Leave"];

  const sessionOptions = [
    { value: "first", label: "First Session" },
    { value: "second", label: "Second Session" },
  ];

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

      // If department changes, clear only the main recipient position, NOT CC positions
      if (name === "selectedDepartment") {
        newFormData.selectedPosition = null;
        // Do NOT clear ccPositions to allow cross-department CC selection
      }

      // If request type changes to Leave Application, reset priority
      if (name === "requestType" && value === "Leave Application") {
        newFormData.priority = ""; // Reset priority for leave applications
        // Clear WFH fields when switching to Leave Application
        newFormData.wfhFromDate = "";
        newFormData.wfhToDate = "";
      } else if (name === "requestType" && value === "Work from Home") {
        newFormData.priority = ""; // Reset priority for WFH applications
        // Clear Leave fields when switching to Work from Home
        newFormData.leaveType = "";
        newFormData.fromDate = "";
        newFormData.fromSession = "first";
        newFormData.toDate = "";
        newFormData.toSession = "second";
      } else if (name === "requestType" && value !== "Leave Application" && value !== "Work from Home") {
        newFormData.priority = "Medium"; // Set default priority for non-leave/WFH requests
        // Clear both Leave and WFH fields for other request types example: "general" and actual "other"
        newFormData.leaveType = "";
        newFormData.fromDate = "";
        newFormData.fromSession = "first";
        newFormData.toDate = "";
        newFormData.toSession = "second";
        newFormData.wfhFromDate = "";
        newFormData.wfhToDate = "";
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
      // Reset leave specific fields
      leaveType: "",
      fromDate: "",
      fromSession: "first",
      toDate: "",
      toSession: "second",
      // Reset WFH specific fields
      wfhFromDate: "",
      wfhToDate: "",
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

    // Additional validation for leave applications
    if (formData.requestType === "Leave Application") {
      if (!formData.leaveType || !formData.fromDate || !formData.toDate) {
        setSnackbar({
          open: true,
          message:
            "Please fill in all leave details: leave type, from date, and to date",
          severity: "error",
        });
        return;
      }

      // Validate date range
      const fromDateObj = new Date(formData.fromDate);
      const toDateObj = new Date(formData.toDate);

      if (fromDateObj > toDateObj) {
        setSnackbar({
          open: true,
          message: "From date cannot be later than to date",
          severity: "error",
        });
        return;
      }
    }

    // Additional validation for Work from Home applications
    if (formData.requestType === "Work from Home") {
      if (!formData.wfhFromDate || !formData.wfhToDate) {
        setSnackbar({
          open: true,
          message: "Please fill in both from date and to date for Work from Home request",
          severity: "error",
        });
        return;
      }

      // Validate date range
      const wfhFromDateObj = new Date(formData.wfhFromDate);
      const wfhToDateObj = new Date(formData.wfhToDate);

      if (wfhFromDateObj > wfhToDateObj) {
        setSnackbar({
          open: true,
          message: "From date cannot be later than to date",
          severity: "error",
        });
        return;
      }
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
        // No priority for leave applications or WFH - use None instead
        priority: (formData.requestType === "Leave Application" || formData.requestType === "Work from Home") ? "None" : formData.priority,
        // Include leave-specific fields if it's a leave application
        ...(formData.requestType === "Leave Application" && {
          leaveDetails: {
            leaveType: formData.leaveType,
            fromDate: formData.fromDate,
            fromSession: formData.fromSession,
            toDate: formData.toDate,
            toSession: formData.toSession,
          },
          requiresApproval: true, // Mark leave applications as requiring approval
        }),
        // Include WFH-specific fields if it's a Work from Home request
        ...(formData.requestType === "Work from Home" && {
          wfhDetails: {
            fromDate: formData.wfhFromDate,
            toDate: formData.wfhToDate,
          },
          requiresApproval: true, // Mark WFH requests as requiring approval
        }),
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
  };

  // Helper function to get filtered positions based on selected department
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

  // Helper function to get all positions across all departments for CC
  const getAllPositionsForCC = () => {
    const allPositions = [];
    availableDepartments.forEach(dept => {
      dept.positions.forEach(position => {
        allPositions.push({
          ...position,
          departmentName: dept.department, 
          uniqueId: `${position._id}_${dept.department}` 
        });
      });
    });
    return allPositions;
  };

  // Helper function to get available CC positions (excluding main recipient and duplicates)
  const getAvailableCCPositions = () => {
    const allPositions = getAllPositionsForCC();
    
    return allPositions.filter(pos => {
      // Exclude if it's the main recipient position (same _id and department)
      if (formData.selectedPosition && 
          pos._id === formData.selectedPosition._id &&
          pos.departmentName === formData.selectedDepartment) {
        return false;
      }
      
      // Exclude if already selected as CC (prevent exact same position-department combination)
      if (formData.ccPositions.some(ccPos => ccPos.uniqueId === pos.uniqueId)) {
        return false;
      }
      
      return true;
    });
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
            <Tab icon={<HistoryIcon />} label="Mail History" iconPosition="start" />
          </Tabs>
        </Paper>
        {/* Send Mail Tab */}
        {currentTab === 0 && (
          <MailComposeForm
            formData={formData}
            handleFormChange={handleFormChange}
            handlePositionChange={handlePositionChange}
            resetForm={resetForm}
            handleSendMail={handleSendMail}
            sending={sending}
            requestTypes={requestTypes}
            priorities={priorities}
            leaveTypes={leaveTypes}
            sessionOptions={sessionOptions}
            availableDepartments={availableDepartments}
            getFilteredPositions={getFilteredPositions}
            getAvailableCCPositions={getAvailableCCPositions}
          />
        )}
        {/* Mail History Tab */}
        {currentTab === 1 && (
          <MailHistoryTable
            mailHistory={mailHistory}
            loading={loading}
            openMailDetail={openMailDetail}
          />
        )}
      </Container>
      {/* Mail Detail Modal */}
      <MailDetailModal
        open={showDetailModal}
        onClose={closeMailDetail}
        selectedMail={selectedMail}
      />
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
