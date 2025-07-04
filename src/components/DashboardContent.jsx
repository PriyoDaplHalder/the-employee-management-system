import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Card, CardContent, Grid, CircularProgress } from "@mui/material";
import { getToken } from "../utils/storage";

const DashboardContent = ({ user }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ employeeCount: 0, activeEmployeeCount: 0, inactiveEmployeeCount: 0, projectCount: 0, activeProjectCount: 0, inactiveProjectCount: 0, taskCount: 0, taskCountOverdue: 0, taskCountDueToday: 0, taskCountCompleted: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

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
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch weather");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const token = getToken();
        if (!token) return;
        const statsRes = await fetch("/api/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        const taskRes = await fetch("/api/management/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const taskData = await taskRes.json();
        setStats({
          employeeCount: statsData.employeeCount || 0,
          activeEmployeeCount: statsData.activeEmployeeCount || 0,
          inactiveEmployeeCount: statsData.inactiveEmployeeCount || 0,
          projectCount: (statsData.activeProjectCount + statsData.inactiveProjectCount) || 0,
          activeProjectCount: statsData.activeProjectCount || 0,
          inactiveProjectCount: statsData.inactiveProjectCount || 0,
          taskCount: Array.isArray(taskData.tasks) ? taskData.tasks.length : (taskData.taskCount || 0),
          taskCountOverdue: Array.isArray(taskData.tasksOverdue) ? taskData.tasksOverdue.length : (taskData.taskCountOverdue || 0),
          taskCountDueToday: Array.isArray(taskData.tasksDueToday) ? taskData.tasksDueToday.length : (taskData.taskCountDueToday || 0),
          taskCountCompleted: Array.isArray(taskData.tasksCompleted) ? taskData.tasksCompleted.length : (taskData.taskCountCompleted || 0),
        });
      } catch (e) {
        console.log("Error fetching stats:", e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
        {loading ? (
          <Typography variant="body1">Loading weather...</Typography>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : weather ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              style={{ width: 48, height: 48, marginRight: 8 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {weather.name}: {Math.round(weather.main.temp)}°C,{" "}
              {weather.weather[0].main}
            </Typography>
          </Box>
        ) : null}
      </Box>

      {/* Welcome message */}
      <Box sx={{ textAlign: "center", mt: 8, mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, color: "primary.main", mb: 2 }}
        >
          Hi {user?.name || user?.email}, welcome to your{" "}
          {user?.role || "management"} dashboard.
        </Typography>
      </Box>
        {/* Main content area */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Card sx={{ minHeight: 120, textAlign: "center", bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="h4">Employees</Typography>
                  {statsLoading ? <CircularProgress size={24} /> : <Typography variant="h6">Total: {stats.employeeCount}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Active: {stats.activeEmployeeCount}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Inactive: {stats.inactiveEmployeeCount}</Typography>}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ minHeight: 120, textAlign: "center", bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="h4">Projects</Typography>
                  {statsLoading ? <CircularProgress size={24} /> : <Typography variant="h6">Total: {stats.projectCount}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Active: {stats.activeProjectCount}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Inactive: {stats.inactiveProjectCount}</Typography>}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ minHeight: 120, textAlign: "center", bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="h4">Tasks</Typography>
                  {statsLoading ? <CircularProgress size={24} /> : <Typography variant="h6">Total :{stats.taskCount}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Overdue: {stats.taskCountOverdue}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Due Today: {stats.taskCountDueToday}</Typography>}
                  {statsLoading ? "" : <Typography variant="h6">Completed: {stats.taskCountCompleted}</Typography>}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>      
    </Container>
  );
};

export default DashboardContent;