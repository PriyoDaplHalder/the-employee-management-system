"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import Layout from "./Layout";
import EmployeeDetails from "./EmployeeDetails";
import AssignedProjects from "./AssignedProjects";
import AssignedTasks from "./AssignedTasks";
import MailManagement from "./MailManagement";
import InboxManagement from "./InboxManagement";
import { getToken } from "../utils/storage";

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
      case "schedule":
        return <SchedulePlaceholder />;
      case "timesheet":
        return <TimesheetPlaceholder />;
      case "performance":
        return <PerformancePlaceholder />;
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
const DashboardContent = ({ user, hasProfile, profileCompleted, loading }) => {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [dateTime, setDateTime] = useState(new Date().toLocaleString());
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    const city = "Kolkata";
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === 200) {
          setWeather(data);
        } else {
          setError("Weather data not available");
        }
        setWeatherLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch weather");
        setWeatherLoading(false);
      });
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(new Date().toLocaleString());
    };
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // the suffix after a date
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const currentDate = new Date();
  const weekday = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
  });
  const month = currentDate.toLocaleDateString(undefined, { month: "long" });
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const formattedDate = `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  const timenow = dateTime.split(",")[1]?.trim() || "";

  const getWindDirection = (degree) => {
    const directions = [
      "North",
      "North Northeast",
      "Northeast",
      "East Northeast",
      "East",
      "East Southeast",
      "Southeast",
      "South Southeast",
      "South",
      "South Southwest",
      "Southwest",
      "West Southwest",
      "West",
      "West Northwest",
      "Northwest",
      "North Northwest",
    ];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  };

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
          <Card
            sx={{
              p: 4,
              backgroundColor: "#fdfdfd",
              borderRadius: 4,
              boxShadow: 2,
            }}
          >
            {weatherLoading ? (
              <Typography variant="body1">Please wait, loading...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" gutterBottom>
                    Hello,{" "}
                    <Typography
                      component="span"
                      color="primary"
                      fontWeight={600}
                    >
                      {user.email?.split("@")[0] || "User"}
                    </Typography>
                    !
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    It's <strong>{formattedDate}</strong>. The current time is{" "}
                    <strong>{timenow}</strong>.
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Current weather in{" "}
                    <Typography
                      component="span"
                      color="primary"
                      fontWeight={600}
                    >
                      {weather.name}
                    </Typography>{" "}
                    is <em>{weather.weather[0].description}</em> with a
                    temperature of{" "}
                    <strong>{Math.round(weather.main.temp)}°C</strong> (feels
                    like{" "}
                    <strong>{Math.round(weather.main.feels_like)}°C</strong>).
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Humidity: <strong>{weather.main.humidity}%</strong>, Wind: {" "}
                    <strong>{weather.wind.speed} km/h</strong> from the {" "}
                    <strong>{getWindDirection(weather.wind.deg)}</strong>.
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={4}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    width={80}
                    style={{
                      borderRadius: "50%",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Typography variant="caption" fontStyle="italic">
                    {weather.weather[0].main}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

// Placeholder components for navigation items
const SchedulePlaceholder = () => (
  <Container maxWidth="lg">
    <Typography
      variant="h4"
      gutterBottom
      sx={{ fontWeight: 600, color: "primary.main" }}
    >
      Schedule
    </Typography>
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Schedule management coming soon
      </Typography>
    </Paper>
  </Container>
);

const TimesheetPlaceholder = () => (
  <Container maxWidth="lg">
    <Typography
      variant="h4"
      gutterBottom
      sx={{ fontWeight: 600, color: "primary.main" }}
    >
      Timesheet
    </Typography>
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Timesheet tracking coming soon
      </Typography>
    </Paper>
  </Container>
);

const PerformancePlaceholder = () => (
  <Container maxWidth="lg">
    <Typography
      variant="h4"
      gutterBottom
      sx={{ fontWeight: 600, color: "primary.main" }}
    >
      Performance
    </Typography>
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Performance analytics coming soon
      </Typography>
    </Paper>
  </Container>
);

export default EmployeeDashboard;
