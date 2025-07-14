import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Divider,
} from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getToken } from "../utils/storage";

const COLORS = ["#4caf50", "#2196f3", "#f44336", "#ff9800"];

const StatCard = ({ title, data, loading }) => (
  <Card
    sx={{
      borderRadius: 4,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      p: 3,
      backgroundColor: "#ffffff",
      height: "100%",
      transition: "0.3s",
      "&:hover": {
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        transform: "translateY(-3px)",
      },
      minWidth: "250px"

    }}
  >
    <Typography variant="h6" fontWeight={600} mb={2} align="center">
      {title}
    </Typography>
    {loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    ) : (
      <>
        <Box sx={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box>
          {data.map((item, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{
                color: COLORS[index % COLORS.length],
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {item.label}: {item.value}
            </Typography>
          ))}
        </Box>
      </>
    )}
  </Card>
);

const DashboardContent = ({ user }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    employeeCount: 0,
    activeEmployeeCount: 0,
    inactiveEmployeeCount: 0,
    projectCount: 0,
    activeProjectCount: 0,
    inactiveProjectCount: 0,
    taskCount: 0,
    taskCountOverdue: 0,
    taskCountDueToday: 0,
    taskCountCompleted: 0,
  });
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
          projectCount:
            statsData.activeProjectCount + statsData.inactiveProjectCount || 0,
          activeProjectCount: statsData.activeProjectCount || 0,
          inactiveProjectCount: statsData.inactiveProjectCount || 0,
          taskCount: Array.isArray(taskData.tasks)
            ? taskData.tasks.length
            : taskData.taskCount || 0,
          taskCountOverdue: Array.isArray(taskData.tasksOverdue)
            ? taskData.tasksOverdue.length
            : taskData.taskCountOverdue || 0,
          taskCountDueToday: Array.isArray(taskData.tasksDueToday)
            ? taskData.tasksDueToday.length
            : taskData.taskCountDueToday || 0,
          taskCountCompleted: Array.isArray(taskData.tasksCompleted)
            ? taskData.tasksCompleted.length
            : taskData.taskCountCompleted || 0,
        });
      } catch (e) {
        console.log("Error fetching stats:", e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentDate = new Date();

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, backgroundColor: "#fdfdfd", borderRadius: 4 }}>
            <Typography variant="h6" color="primary" fontWeight={600}>
              Hello, {user.email?.split("@")[0] || "User"}!
            </Typography>
            <Typography variant="body1" mt={1}>
              {currentDate.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
            <Typography variant="h5" mt={2} fontWeight={700}>
              {currentDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, backgroundColor: "#fdfdfd", borderRadius: 4 }}>
            {loading ? (
              <Typography>Loading weather...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    Weather in {weather.name}
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    <strong>Condition:</strong> {weather.weather[0].description}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Temperature:</strong>{" "}
                    <span style={{ color: "#f57c00", fontWeight: 600 }}>
                      {Math.round(weather.main.temp)}°C
                    </span>
                  </Typography>
                  <Typography variant="body2">
                    <strong>Feels like:</strong>{" "}
                    {Math.round(weather.main.feels_like)}°C
                  </Typography>
                  <Typography variant="body2">
                    <strong>Humidity:</strong> {weather.main.humidity}% <br />
                    <strong>Wind:</strong> {Math.round(weather.wind.speed)} km/h
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="center">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    width={80}
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

      {/* Stat Section */}
      <Grid container spacing={4} sx={{marginBottom:"50px"}}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Employees"
            loading={statsLoading}
            data={[
              { label: "Total", value: stats.employeeCount },
              { label: "Active", value: stats.activeEmployeeCount },
              { label: "Inactive", value: stats.inactiveEmployeeCount },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Projects"
            loading={statsLoading}
            data={[
              { label: "Total", value: stats.projectCount },
              { label: "Active", value: stats.activeProjectCount },
              { label: "Inactive", value: stats.inactiveProjectCount },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Tasks"
            loading={statsLoading}
            data={[
              { label: "Total", value: stats.taskCount },
              { label: "Overdue", value: stats.taskCountOverdue },
              { label: "Due Today", value: stats.taskCountDueToday },
              { label: "Completed", value: stats.taskCountCompleted },
            ]}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardContent;
