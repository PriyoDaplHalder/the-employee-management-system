"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";

const EmployeeDetails = ({ user, onBack, hasExistingProfile }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
    department: "",
    position: "",
    customPosition: "",
    salary: "",
    hireDate: "",
    phone: "",
    address: "",
    emergencyContact: "",
    skills: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [isViewMode, setIsViewMode] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [isFirstTimeCreation, setIsFirstTimeCreation] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [existingSkills, setExistingSkills] = useState([]);
  const [showCustomPosition, setShowCustomPosition] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const predefinedPositions = [
    "Human Resource",
    "Team Leader",
    "Project Manager",
    "Senior Developer",
    "Junior Developer",
    "Quality Assurance",
    "Business Analyst",
    "Data Scientist",
    "UI/UX Designer",
    "System Administrator",
    "Network Engineer",
    "DevOps Engineer",
    "Technical Support",
    "Sales Executive",
    "Marketing Specialist",
    "Customer Service",
    "Trainee",
    "Student",
    "Intern",
    "Others",
  ];

  const isManagement = user?.role === "management";

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchEmployeeDetails();
      if (!isManagement) {
        await fetchPermissions();
      }
    };

    initializeComponent();
  }, []);

  // Update view mode when profile completion status and permissions are both loaded
  useEffect(() => {
    if (!isManagement && profileCompleted !== null && permissions !== null) {
      // For employees with completed profiles, set view mode based on profile-related permissions
      const hasProfilePermissions =
        permissions &&
        (permissions.canEditBasicInfo === true ||
          permissions.canEditPersonalInfo === true);
      setIsViewMode(!hasProfilePermissions);
    }
  }, [profileCompleted, permissions, isManagement]);

  const fetchEmployeeDetails = async () => {
    setFetchLoading(true);
    try {
      // Only access localStorage after component has mounted
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/employee/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const employee = await response.json();

        // Check if this is a default profile (created during signup with default values)
        const isDefaultProfile =
          (employee.department === "General" || !employee.department) &&
          (employee.position === "Employee" || !employee.position) &&
          (employee.salary === 0 || !employee.salary) &&
          !employee.hireDate;

        if (isDefaultProfile) {
          // Treat as first-time creation
          setProfileExists(false);
          setProfileCompleted(false);
          setIsFirstTimeCreation(true);
          setIsViewMode(false);
        } else {
          setProfileExists(true);
          setProfileCompleted(employee.profileCompleted || false);
          // Set view mode based on completion status and user role
          // For employees: show edit mode if profile is not completed
          // For management: always start in view mode
          // Note: View mode for employees with completed profiles will be adjusted after permissions are fetched
          setIsViewMode(isManagement);
        }

        // Pre-fill form with existing data
        const position = employee.position || "";
        const isCustomPosition =
          position && !predefinedPositions.includes(position);

        const employeeData = {
          firstName: employee.user?.firstName || "",
          lastName: employee.user?.lastName || "",
          employeeId: employee.employeeId || "",
          department: isDefaultProfile ? "" : employee.department || "",
          position: isDefaultProfile
            ? ""
            : isCustomPosition
            ? "Others"
            : position,
          customPosition: isDefaultProfile
            ? ""
            : isCustomPosition
            ? position
            : "",
          salary: isDefaultProfile ? "" : employee.salary?.toString() || "",
          hireDate: employee.hireDate
            ? new Date(employee.hireDate).toISOString().split("T")[0]
            : "",
          phone: employee.personalInfo?.phone || "",
          address: employee.personalInfo?.address?.street || "",
          emergencyContact:
            employee.personalInfo?.emergencyContact?.phone || "",
          skills: Array.isArray(employee.skills)
            ? employee.skills.join(", ")
            : "",
        };

        setFormData(employeeData);
        setOriginalData(employeeData);
        setShowCustomPosition(isCustomPosition && !isDefaultProfile);
        setExistingSkills(employee.skills || []);
      } else if (response.status === 404) {
        // No profile exists, show add form
        setProfileExists(false);
        setProfileCompleted(false);
        setIsFirstTimeCreation(true);
        setIsViewMode(false);
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to fetch employee details",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setSnackbar({
        open: true,
        message: "Error fetching employee details",
        severity: "error",
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) {
        setPermissions(false); // Explicitly set to false when no token
        return;
      }

      const response = await fetch("/api/employee/permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permission || false);
      } else {
        setPermissions(false);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions(false); // Set to false on error
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Helper function to check if a field is editable
  const isFieldEditable = (fieldName) => {
    // Management can always edit
    if (isManagement) {
      return true;
    }

    // If profile is completed, check permissions for employees
    if (profileCompleted && !isManagement) {
      // If permissions are still loading, default to not editable
      if (permissionsLoading || permissions === null) {
        return false;
      }

      // If no permissions granted, not editable
      if (!permissions) {
        return false;
      }

      // Check specific field permissions
      // Basic info permissions
      if (
        fieldName === "firstName" &&
        permissions.canEditBasicInfo &&
        permissions.basicInfoFields?.firstName
      ) {
        return true;
      }
      if (
        fieldName === "lastName" &&
        permissions.canEditBasicInfo &&
        permissions.basicInfoFields?.lastName
      ) {
        return true;
      }

      // Personal info permissions
      if (
        fieldName === "phone" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.phone
      ) {
        return true;
      }
      if (
        fieldName === "address" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.address
      ) {
        return true;
      }
      if (
        fieldName === "emergencyContact" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.emergencyContact
      ) {
        return true;
      }
      if (
        fieldName === "skills" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.skills
      ) {
        return true;
      }

      // If profile is completed but no specific permission for this field, not editable
      return false;
    }

    // Department and salary are not editable by employees
    if (
      (fieldName === "department" || fieldName === "salary") &&
      !isManagement
    ) {
      return false;
    }

    // If it's first time creation or no profile exists, all fields are editable (except department and salary for employees)
    if (isFirstTimeCreation || !profileExists) {
      return true;
    }

    // If profile exists but not completed, check if field is empty or has default values
    const originalValue = originalData[fieldName];
    const isEmptyField = !originalValue || originalValue.trim() === "";
    const isDefaultValue =
      fieldName === "position" && originalValue === "Employee";

    return isEmptyField || isDefaultValue;
  };

  // Helper function to get permission-aware helper text
  const getFieldHelperText = (fieldName) => {
    if (!isFieldEditable(fieldName)) {
      if (profileCompleted && !isManagement && permissions) {
        // Check if this field has permission but is currently disabled for other reasons
        let hasPermission = false;
        if (
          fieldName === "firstName" &&
          permissions.canEditBasicInfo &&
          permissions.basicInfoFields?.firstName
        )
          hasPermission = true;
        if (
          fieldName === "lastName" &&
          permissions.canEditBasicInfo &&
          permissions.basicInfoFields?.lastName
        )
          hasPermission = true;
        if (
          fieldName === "phone" &&
          permissions.canEditPersonalInfo &&
          permissions.personalInfoFields?.phone
        )
          hasPermission = true;
        if (
          fieldName === "address" &&
          permissions.canEditPersonalInfo &&
          permissions.personalInfoFields?.address
        )
          hasPermission = true;
        if (
          fieldName === "emergencyContact" &&
          permissions.canEditPersonalInfo &&
          permissions.personalInfoFields?.emergencyContact
        )
          hasPermission = true;
        if (
          fieldName === "skills" &&
          permissions.canEditPersonalInfo &&
          permissions.personalInfoFields?.skills
        )
          hasPermission = true;

        if (!hasPermission) {
          return "No permission to edit this field. Contact management for access.";
        }
      }

      if (formData[fieldName]) {
        return "Field already filled and cannot be changed";
      }

      if (
        (fieldName === "department" || fieldName === "salary") &&
        !isManagement
      ) {
        return `${
          fieldName === "department" ? "Department" : "Salary"
        } is assigned by management`;
      }
    }

    // Field is editable, check if it's due to permissions
    if (profileCompleted && !isManagement && permissions) {
      let hasPermission = false;
      if (
        fieldName === "firstName" &&
        permissions.canEditBasicInfo &&
        permissions.basicInfoFields?.firstName
      )
        hasPermission = true;
      if (
        fieldName === "lastName" &&
        permissions.canEditBasicInfo &&
        permissions.basicInfoFields?.lastName
      )
        hasPermission = true;
      if (
        fieldName === "phone" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.phone
      )
        hasPermission = true;
      if (
        fieldName === "address" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.address
      )
        hasPermission = true;
      if (
        fieldName === "emergencyContact" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.emergencyContact
      )
        hasPermission = true;
      if (
        fieldName === "skills" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.skills
      )
        hasPermission = true;

      if (hasPermission) {
        return "Edit permission granted by management";
      }
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Management can always edit
    if (isManagement) {
      if (name === "position") {
        setShowCustomPosition(value === "Others");
        if (value !== "Others") {
          setFormData({
            ...formData,
            [name]: value,
            customPosition: "", // Clear custom position when predefined is selected
          });
        } else {
          setFormData({
            ...formData,
            [name]: value,
          });
        }
      } else {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
      return;
    }

    // For employees: if profile is completed, check permissions
    if (profileCompleted && !isManagement) {
      if (!permissions) {
        // No permissions at all
        return;
      }

      // Check if the field has specific permission
      let hasPermission = false;

      // Check basic info permissions
      if (
        name === "firstName" &&
        permissions.canEditBasicInfo &&
        permissions.basicInfoFields?.firstName
      ) {
        hasPermission = true;
      }
      if (
        name === "lastName" &&
        permissions.canEditBasicInfo &&
        permissions.basicInfoFields?.lastName
      ) {
        hasPermission = true;
      }

      // Check personal info permissions
      if (
        name === "phone" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.phone
      ) {
        hasPermission = true;
      }
      if (
        name === "address" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.address
      ) {
        hasPermission = true;
      }
      if (
        name === "emergencyContact" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.emergencyContact
      ) {
        hasPermission = true;
      }
      if (
        name === "skills" &&
        permissions.canEditPersonalInfo &&
        permissions.personalInfoFields?.skills
      ) {
        hasPermission = true;
      }

      if (!hasPermission) {
        return;
      }

      // If we reach here, the user has permission to edit this field
      // Skip the empty field check and proceed to update
    } else {
      // For incomplete profiles: only allow editing empty fields
      if (profileExists && !isFirstTimeCreation && !profileCompleted) {
        const originalValue = originalData[name];
        if (originalValue && originalValue.trim() !== "") {
          // Field already has data, don't allow changes
          return;
        }
      }
    }

    if (name === "position") {
      setShowCustomPosition(value === "Others");
      if (value !== "Others") {
        setFormData({
          ...formData,
          [name]: value,
          customPosition: "", // Clear custom position when predefined is selected
        });
      } else {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e, completeProfile = false) => {
    e.preventDefault();
    setLoading(true);

    // If it's a first-time creation, validate required fields
    if (isFirstTimeCreation || !profileExists) {
      const requiredFields = [
        "firstName",
        "lastName",
        "department",
        "position",
        "hireDate",
      ];

      // Check for custom position when "Others" is selected
      if (formData.position === "Others" && !formData.customPosition.trim()) {
        setSnackbar({
          open: true,
          message:
            "Please enter a custom position title when 'Others' is selected",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      const missingFields = requiredFields.filter(
        (field) => !formData[field].trim()
      );

      if (missingFields.length > 0) {
        setSnackbar({
          open: true,
          message: `Please fill in all required fields: ${missingFields.join(
            ", "
          )}`,
          severity: "error",
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Only access localStorage after component has mounted
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: "No authentication token found",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      // Convert skills string to array
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill);

      // Use custom position if "Others" is selected, otherwise use the selected position
      const finalPosition =
        formData.position === "Others"
          ? formData.customPosition
          : formData.position;

      const submissionData = {
        ...formData,
        position: finalPosition,
        skills: skillsArray,
        completeProfile,
      };

      // Determine which endpoint to use based on profile completion status and permissions
      let apiEndpoint = "/api/employee/profile";
      let method = isFirstTimeCreation || !profileExists ? "POST" : "PATCH";

      // If profile is completed and employee has permissions, use the specialized endpoint
      if (profileCompleted && permissions && !isManagement) {
        apiEndpoint = "/api/employee/profile/permitted-update";
        method = "PATCH";
      }

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();
      if (response.ok) {
        if (completeProfile) {
          setSnackbar({
            open: true,
            message:
              "Profile submitted successfully! Your profile is now locked for editing. Contact management for any changes.",
            severity: "success",
          });
          setProfileCompleted(true);
        } else {
          // Contextual success message based on whether permissions were used
          const isPermissionUpdate =
            profileCompleted && permissions && !isManagement;
          let successMessage = "Employee details saved successfully!";

          if (isPermissionUpdate) {
            // Check if permissions were revoked
            if (data.permissionsRevoked) {
              successMessage =
                "Profile updated successfully using granted permissions! Permissions have been automatically revoked for security.";
              // Clear permissions state since they were revoked
              setPermissions(false);
              setIsViewMode(true); // Switch back to view mode since no more permissions
            } else {
              successMessage =
                "Profile updated successfully using granted permissions!";
            }
          }

          setSnackbar({
            open: true,
            message: successMessage,
            severity: "success",
          });
        }
        setProfileExists(true);
        setIsViewMode(true);
        setExistingSkills(skillsArray);

        // Refresh the data and permissions
        setTimeout(() => {
          fetchEmployeeDetails();
          if (!isManagement) {
            fetchPermissions(); // Refresh permissions to reflect any changes
          }
        }, 1000);
      } else {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.error || "Failed to save employee details",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error saving employee details:", error);
      setSnackbar({
        open: true,
        message: "Error saving employee details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSkills = () => {
    if (!existingSkills || existingSkills.length === 0) {
      return (
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
          }}
        >
          No skills listed
        </Typography>
      );
    }

    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {existingSkills.map((skill, index) => (
          <Chip
            key={index}
            label={skill}
            sx={{
              bgcolor: "primary.50",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.200",
              fontWeight: 500,
              fontSize: "0.875rem",
              pointerEvents: "none",

              "&:hover": {
                bgcolor: "primary.100",
              },
            }}
            size="medium"
          />
        ))}
      </Box>
    );
  };

  if (fetchLoading || (!isManagement && permissionsLoading)) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: "grey.50", minHeight: "100vh" }}>
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
              Employee Details
            </Typography>
          </Toolbar>
        </AppBar>
        <Container
          maxWidth="md"
          sx={{ mt: 4, display: "flex", justifyContent: "center" }}
        >
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "grey.50", minHeight: "100vh" }}>
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
            {profileExists ? "My Profile" : "Add Employee Details"}
          </Typography>
          {profileExists && isManagement && (
            <Button
              variant="outlined"
              onClick={() => setIsViewMode(!isViewMode)}
              sx={{ ml: 2 }}
            >
              {isViewMode ? "Edit" : "Cancel"}
            </Button>
          )}
          {/* {profileExists && !isManagement && !profileCompleted && (
            <Button
              variant="outlined"
              onClick={() => setIsViewMode(!isViewMode)}
              sx={{ ml: 2 }}
            >
              {isViewMode ? "Edit Profile" : "Cancel"}
            </Button>
          )} */}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {profileExists && !isManagement && (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "info.main", fontWeight: 500 }}
            >
              {profileCompleted
                ? permissions &&
                  (permissions.canEditBasicInfo ||
                    permissions.canEditPersonalInfo)
                  ? "Your profile is completed and locked. You have been granted temporary profile edit permissions for specific fields. These permissions will be automatically revoked after you save your changes."
                  : "Your profile is completed and locked for editing. Contact management for any changes."
                : "Fill the empty fields carefully. Once you complete your profile, it will be locked."}
            </Typography>
          </Paper>
        )}

        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: "white",
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            {profileExists ? "Employee Profile" : "Create Employee Profile"}
          </Typography>

          {/* Profile Status Indicator */}
          {profileExists && (
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Chip
                label={
                  profileCompleted ? "Profile Completed" : "Profile In Progress"
                }
                color={profileCompleted ? "success" : "warning"}
                variant="filled"
                icon={profileCompleted ? <CheckCircleIcon /> : <EditIcon />}
                sx={{ fontWeight: 600, pointerEvents: "none" }}
              />
              {profileCompleted && (
                <Typography variant="body2" color="text.secondary">
                  Profile locked for editing. Contact management for changes.
                </Typography>
              )}
            </Box>
          )}

          {/* Permissions Status Indicator for Employees */}
          {profileExists && !isManagement && profileCompleted && (
            <Box sx={{ mb: 3 }}>
              {(() => {
                // Check if user has any profile-related permissions (not project permissions)
                const hasProfilePermissions =
                  permissions &&
                  (permissions.canEditBasicInfo === true ||
                    permissions.canEditPersonalInfo === true);

                return hasProfilePermissions ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      label="Profile Edit Permissions Granted"
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    {permissions.canEditBasicInfo && (
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {permissions.basicInfoFields?.firstName && (
                          <Chip
                            label="First Name"
                            size="small"
                            color="primary"
                          />
                        )}
                        {permissions.basicInfoFields?.lastName && (
                          <Chip
                            label="Last Name"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    )}
                    {permissions.canEditPersonalInfo && (
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {permissions.personalInfoFields?.phone && (
                          <Chip label="Phone" size="small" color="secondary" />
                        )}
                        {permissions.personalInfoFields?.address && (
                          <Chip
                            label="Address"
                            size="small"
                            color="secondary"
                          />
                        )}
                        {permissions.personalInfoFields?.emergencyContact && (
                          <Chip
                            label="Emergency Contact"
                            size="small"
                            color="secondary"
                          />
                        )}
                        {permissions.personalInfoFields?.skills && (
                          <Chip label="Skills" size="small" color="secondary" />
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Chip
                    label="No Profile Edit Permissions"
                    color="default"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 500, pointerEvents: "none" }}
                  />
                );
              })()}
            </Box>
          )}

          {isViewMode && profileExists && (profileCompleted || isManagement) ? (
            // View Mode - Show details as read-only
            <Grid container spacing={4}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    Basic Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Employee ID
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.employeeId || "Not assigned"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          First Name
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.firstName || "Not provided"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Last Name
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.lastName || "Not provided"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Work Information Section */}
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    Work Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Department
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.department || "Not assigned"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Position
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.position === "Others"
                              ? formData.customPosition || "Not assigned"
                              : formData.position || "Not assigned"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Salary (INR)
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              color: "text.primary",
                            }}
                          >
                            {formData.salary
                              ? `₹${parseInt(formData.salary).toLocaleString()}`
                              : "Not disclosed"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Hire Date
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.hireDate
                              ? new Date(formData.hireDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : "Not provided"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    Personal Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Phone Number
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.phone || "Not provided"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Emergency Contact
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.emergencyContact || "Not provided"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Address
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.address || "Not provided"}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Skills & Expertise
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          {renderSkills()}
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            // Form Mode - For adding new profile or editing (management only)
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={4}>
                {/* Basic Information Section */}
                <Grid item xs={12}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "white",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      Basic Information
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="firstName"
                          label="First Name *"
                          value={formData.firstName}
                          onChange={handleChange}
                          variant="outlined"
                          required
                          disabled={!isFieldEditable("firstName")}
                          helperText={getFieldHelperText("firstName")}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("firstName")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="lastName"
                          label="Last Name *"
                          value={formData.lastName}
                          onChange={handleChange}
                          variant="outlined"
                          required
                          disabled={!isFieldEditable("lastName")}
                          helperText={getFieldHelperText("lastName")}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("lastName")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="employeeId"
                          label="Employee ID"
                          value={formData.employeeId}
                          onChange={handleChange}
                          variant="outlined"
                          disabled={!isFieldEditable("employeeId")}
                          helperText={
                            !isFieldEditable("employeeId") &&
                            formData.employeeId
                              ? "Field already assigned and cannot be changed"
                              : "Auto-generated if empty"
                          }
                          placeholder="Auto-generated if empty"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("employeeId")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Work Information Section */}
                <Grid item xs={12}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "white",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      Work Information
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="department"
                          label="Department *"
                          value={formData.department}
                          onChange={handleChange}
                          variant="outlined"
                          required
                          disabled={!isFieldEditable("department")}
                          helperText={
                            !isManagement
                              ? "Department is assigned by management"
                              : !isFieldEditable("department") &&
                                formData.department
                              ? "Field already filled and cannot be changed"
                              : ""
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("department")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          required
                          disabled={!isFieldEditable("position")}
                        >
                          <InputLabel>Position *</InputLabel>
                          <Select
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            label="Position *"
                            sx={{
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("position")
                                ? "grey.100"
                                : "white",
                            }}
                          >
                            {predefinedPositions.map((position) => (
                              <MenuItem key={position} value={position}>
                                {position}
                              </MenuItem>
                            ))}
                          </Select>
                          {!isFieldEditable("position") &&
                            formData.position && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, ml: 1 }}
                              >
                                Field already filled and cannot be changed
                              </Typography>
                            )}
                        </FormControl>
                      </Grid>

                      {/* Custom Position Field - Only show when "Others" is selected */}
                      {showCustomPosition && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            name="customPosition"
                            label="Custom Position *"
                            value={formData.customPosition}
                            onChange={handleChange}
                            variant="outlined"
                            required
                            disabled={!isFieldEditable("customPosition")}
                            helperText={
                              !isFieldEditable("customPosition") &&
                              formData.customPosition
                                ? "Field already filled and cannot be changed"
                                : "Enter custom position title"
                            }
                            placeholder="Enter custom position title"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                bgcolor: !isFieldEditable("customPosition")
                                  ? "grey.100"
                                  : "white",
                              },
                            }}
                          />
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="salary"
                          label="Salary (INR)"
                          type="number"
                          value={formData.salary}
                          onChange={handleChange}
                          variant="outlined"
                          disabled={!isFieldEditable("salary")}
                          helperText={
                            !isManagement
                              ? "Salary is assigned by management"
                              : !isFieldEditable("salary") && formData.salary
                              ? "Field already filled and cannot be changed"
                              : ""
                          }
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ mr: 1 }}>₹</Typography>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("salary")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="hireDate"
                          label="Hire Date *"
                          type="date"
                          value={formData.hireDate}
                          onChange={handleChange}
                          variant="outlined"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          required
                          disabled={!isFieldEditable("hireDate")}
                          helperText={
                            !isFieldEditable("hireDate") && formData.hireDate
                              ? "Field already filled and cannot be changed"
                              : ""
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("hireDate")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Personal Information Section */}
                <Grid item xs={12}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "white",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      Personal Information
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="phone"
                          type="number"
                          label="Phone Number"
                          value={formData.phone}
                          onChange={handleChange}
                          variant="outlined"
                          disabled={!isFieldEditable("phone")}
                          helperText={getFieldHelperText("phone")}
                          placeholder="e.g., +91 9876543210"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("phone")
                                ? "grey.100"
                                : "white",
                            },
                            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                              {
                                display: "none",
                                WebkitAppearance: "none",
                                margin: 0,
                              },
                            "& input[type=number]": {
                              MozAppearance: "textfield",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="emergencyContact"
                          label="Emergency Contact"
                          type="number"
                          value={formData.emergencyContact}
                          onChange={handleChange}
                          variant="outlined"
                          disabled={!isFieldEditable("emergencyContact")}
                          helperText={getFieldHelperText("emergencyContact")}
                          placeholder="e.g., +91 9876543210"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("emergencyContact")
                                ? "grey.100"
                                : "white",
                            },
                            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                              {
                                display: "none",
                                WebkitAppearance: "none",
                                margin: 0,
                              },
                            "& input[type=number]": {
                              MozAppearance: "textfield",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="address"
                          label="Address"
                          value={formData.address}
                          onChange={handleChange}
                          variant="outlined"
                          multiline
                          rows={2}
                          disabled={!isFieldEditable("address")}
                          helperText={getFieldHelperText("address")}
                          placeholder="Street address"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("address")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="skills"
                          label="Skills (comma-separated)"
                          value={formData.skills}
                          onChange={handleChange}
                          variant="outlined"
                          disabled={!isFieldEditable("skills")}
                          helperText={
                            getFieldHelperText("skills") ||
                            "Enter skills separated by commas"
                          }
                          placeholder="e.g., JavaScript, React, Node.js, Python"
                          multiline
                          rows={2}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: !isFieldEditable("skills")
                                ? "grey.100"
                                : "white",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                    {isFirstTimeCreation || !profileExists ? (
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        onClick={(e) => handleSubmit(e, true)}
                        sx={{
                          minWidth: 120,
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: "none",
                          bgcolor: "primary.main",
                          "&:hover": {
                            bgcolor: "primary.dark",
                            transform: "translateY(-1px)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Submit Details"
                        )}
                      </Button>
                    ) : !profileCompleted ? (
                      // For employees with incomplete profiles, only show Submit Details button
                      !isManagement ? (
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading}
                          onClick={(e) => handleSubmit(e, true)}
                          sx={{
                            minWidth: 120,
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: "none",
                            bgcolor: "primary.main",
                            "&:hover": {
                              bgcolor: "primary.dark",
                              transform: "translateY(-1px)",
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          {loading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Submit Details"
                          )}
                        </Button>
                      ) : (
                        // For management, keep both buttons
                        <>
                          <Button
                            type="submit"
                            variant="outlined"
                            disabled={loading}
                            onClick={(e) => handleSubmit(e, false)}
                            sx={{
                              minWidth: 120,
                              borderRadius: 2,
                              fontWeight: 600,
                              textTransform: "none",
                              borderColor: "primary.main",
                              color: "primary.main",
                              "&:hover": {
                                borderColor: "primary.dark",
                                bgcolor: "primary.50",
                              },
                            }}
                          >
                            {loading ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            onClick={(e) => handleSubmit(e, true)}
                            sx={{
                              minWidth: 120,
                              borderRadius: 2,
                              fontWeight: 600,
                              textTransform: "none",
                              bgcolor: "success.main",
                              "&:hover": {
                                bgcolor: "success.dark",
                                transform: "translateY(-1px)",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            {loading ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              "Complete Profile"
                            )}
                          </Button>
                        </>
                      )
                    ) : profileCompleted &&
                      !isManagement &&
                      permissions &&
                      (permissions.canEditBasicInfo ||
                        permissions.canEditPersonalInfo) ? (
                      // For employees with completed profiles who have profile edit permissions
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        onClick={(e) => handleSubmit(e, false)}
                        sx={{
                          minWidth: 120,
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: "none",
                          bgcolor: "warning.main",
                          "&:hover": {
                            bgcolor: "warning.dark",
                            transform: "translateY(-1px)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Save Changes (Will Revoke Permissions)"
                        )}
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="outlined"
                      onClick={onBack}
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 500,
                        textTransform: "none",
                        borderColor: "grey.300",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "grey.400",
                          bgcolor: "grey.50",
                        },
                      }}
                    >
                      Back to Dashboard
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default EmployeeDetails;
