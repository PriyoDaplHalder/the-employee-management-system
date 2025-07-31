"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";
import EmployeeProfileForm from "./EmployeeProfileForm";
import EmployeeProfileSummary from "./EmployeeProfileSummary";

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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: "transparent", borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar>
          <IconButton edge="start" color="primary" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "text.primary" }}>
            Employee Details
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper sx={{ p: 4, mt: 3, borderRadius: 3, boxShadow: 3 }}>
        {isViewMode ? (
          <EmployeeProfileSummary formData={formData} renderSkills={renderSkills} />
        ) : (
          <EmployeeProfileForm
            formData={formData}
            handleChange={handleChange}
            isFieldEditable={isFieldEditable}
            getFieldHelperText={getFieldHelperText}
            predefinedPositions={predefinedPositions}
            showCustomPosition={showCustomPosition}
            isManagement={isManagement}
            onSubmit={handleSubmit}
            loading={loading}
            isFirstTimeCreation={isFirstTimeCreation}
            profileExists={profileExists}
            profileCompleted={profileCompleted}
          />
        )}
      </Paper>
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Container>
  );
};

export default EmployeeDetails;
