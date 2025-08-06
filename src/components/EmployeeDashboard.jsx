"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  CircularProgress,
} from "@mui/material";
import Layout from "./Layout";
import EmployeeDetails from "./EmployeeDetails";
import AssignedProjects from "./AssignedProjects";
import AssignedTasks from "./AssignedTasks";
import MailManagement from "./MailManagement";
import InboxManagement from "./InboxManagement";
import EmployeeLeaves from "./EmployeeLeaves";
import EmployeeAttendance from "./EmployeeAttendance";
import { getToken } from "../utils/storage";
import HelloMessageCard from "./HelloMessageCard";

const EmployeeDashboard = ({ user, onLogout }) => {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [hasProfile, setHasProfile] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [myProjectCount, setMyProjectCount] = useState(0);
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted) {
      checkExistingProfile();
      fetchStats();
      fetchMyProjectCount();
      fetchMyTaskCount();
    }
  }, [mounted]);
  const fetchStats = async () => {
    try {
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setEmployeeCount(stats.employeeCount || 0);
        setProjectCount(stats.projectCount || 0);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchMyProjectCount = async () => {
    try {
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/employee/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyProjectCount(data.assignments?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching my project count:", error);
    }
  };

  const fetchMyTaskCount = async () => {
    try {
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/employee/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyTaskCount(data.tasks?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching my task count:", error);
    }
  };

  const checkExistingProfile = async () => {
    try {
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
        const profileData = await response.json();
        setHasProfile(true);
        setProfileCompleted(profileData.profileCompleted || false);
      } else {
        setHasProfile(false);
        setProfileCompleted(false);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleAddDetails = () => {
    setCurrentView("details");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    checkExistingProfile();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "details":
        return (
          <EmployeeDetails
            user={user}
            onBack={handleBackToDashboard}
            hasExistingProfile={hasProfile}
          />
        );
      case "projects":
        return (
          <AssignedProjects
            user={user}
            onBack={handleBackToDashboard}
            onProjectCountChange={setMyProjectCount}
          />
        );
      case "tasks":
        return (
          <AssignedTasks
            user={user}
            onBack={handleBackToDashboard}
            onTaskCountChange={setMyTaskCount}
          />
        );
      case "mailmanagement":
        return <MailManagement user={user} onBack={handleBackToDashboard} />;
      case "inbox":
        return <InboxManagement user={user} onBack={handleBackToDashboard} />;
      case "employeeleavebalance":
        return <EmployeeLeaves user={user} onBack={handleBackToDashboard} />;
      case "employeeattendance":
        return <EmployeeAttendance user={user} onBack={handleBackToDashboard} />;
      default:
        return (
          <DashboardContent
            user={user}
            hasProfile={hasProfile}
            profileCompleted={profileCompleted}
            loading={loading}
          />
        );
    }
  };

  // Show simple layout until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minHeight: "100vh",
            bgcolor: "grey.50",
            pt: 2,
            px: 3,
            py: 2,
          }}
        >
          <DashboardContent
            user={user}
            hasProfile={hasProfile}
            profileCompleted={profileCompleted}
            loading={loading}
          />
        </Box>
      </Box>
    );
  }
  return (
    <Layout
      user={user}
      onLogout={onLogout}
      currentView={currentView}
      onViewChange={handleViewChange}
      onAddDetails={handleAddDetails}
      employeeCount={employeeCount}
      projectCount={myProjectCount}
      taskCount={myTaskCount}
      hasProfile={hasProfile}
    >
      {renderCurrentView()}
    </Layout>
  );
};

// Dashboard main content
const DashboardContent = ({ user, loading }) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3} my={4}>
        <Grid item xs={12} md={6}>
          <HelloMessageCard user={user} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default EmployeeDashboard;
