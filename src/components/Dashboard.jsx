"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
} from "@mui/material";
import Layout from "./Layout";
import DashboardContent from "./DashboardContent";
import AllEmployees from "./AllEmployees";
import ProjectsManagement from "./ProjectsManagement";

import TaskManagement from "./TaskManagement";
import MailMappings from "./MailMappings";
import MailManagement from "./MailManagement";
import InboxManagement from "./InboxManagement";
import Permission from "./Permission";
import { getToken } from "../utils/storage";
import Leaves from "./Leaves";
import Attendance from "./Attendance";

const Dashboard = ({ user, title, onLogout }) => {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [employeeCount, setEmployeeCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchStats();
      fetchTaskCount();
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

  const fetchTaskCount = async () => {
    try {
      if (typeof window === "undefined") return;

      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/management/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTaskCount(data.tasks?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching task count:", error);
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    fetchStats();
    fetchTaskCount();
  };

  const handleProjectCountChange = (newCount) => {
    setProjectCount(newCount);
  };

  const handleEmployeeCountChange = (newCount) => {
    setEmployeeCount(newCount);
  };

  const handleTaskCountChange = (newCount) => {
    setTaskCount(newCount);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "employees":
        return (
          <AllEmployees
            user={user}
            onBack={handleBackToDashboard}
            onEmployeeCountChange={handleEmployeeCountChange}
          />
        );
      case "projects":
        return (
          <ProjectsManagement
            user={user}
            onBack={handleBackToDashboard}
            onProjectCountChange={handleProjectCountChange}
          />
        );
      case "tasks":
        return (
          <TaskManagement
            user={user}
            onBack={handleBackToDashboard}
            onTaskCountChange={handleTaskCountChange}
          />
        );
      case "mailmanagement":
        return <MailManagement user={user} onBack={handleBackToDashboard} />;
      case "inbox":
        return <InboxManagement user={user} onBack={handleBackToDashboard} />;
      case "mailmappings":
        return <MailMappings user={user} onBack={handleBackToDashboard} />;
      case "permissions":
        return <Permission user={user} onBack={handleBackToDashboard} />;
      case "leaves":
        return <Leaves user={user} onBack={handleBackToDashboard} />;
      case "attendance":
        return <Attendance user={user} onBack={handleBackToDashboard} />;
      default:
        return <DashboardContent user={user} />;
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
          <DashboardContent user={user} />
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
      employeeCount={employeeCount}
      projectCount={projectCount}
      taskCount={taskCount}
    >
      {renderCurrentView()}
    </Layout>
  );
};

export default Dashboard;
