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
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getToken } from "../utils/storage";

const COLORS = ["#27AE60", "#E74C3C", "#F39C12", "#ff9800"];
import { PieChart } from "@mui/x-charts/PieChart";

const StatCard = ({ title, data, loading }) => {
  // Separate "Total" from the rest of the segments
  const totalEntry = data.find((item) => item.label.toLowerCase() === "total");
  const pieSegments = data.filter(
    (item) => item.label.toLowerCase() !== "total"
  );
  const total = totalEntry?.value || 0;

  const pieData = pieSegments.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: COLORS[index % COLORS.length],
  }));

  return (
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
        minWidth: "250px",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2} align="center">
        {title}
      </Typography>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <PieChart
            series={[
              {
                data: pieData,
                highlightScope: { faded: "global", highlighted: "item" },
                faded: { additionalRadius: -10, color: "gray" },
              },
            ]}
            width={250}
            height={200}
            slotProps={{ legend: { hidden: true } }}
            sx={{
              [`& .MuiPieArc-root`]: {
                stroke: "#fff",
                strokeWidth: 1,
                transition: "0.3s",
                "&:hover": {
                  cursor: "pointer",
                  transform: "scale(1.05)",
                },
              },
            }}
          />
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="body2"
            textAlign="center"
            fontWeight={600}
            mb={1}
          >
            Total: {total}
          </Typography>
          <Box>
            {pieSegments.map((item, index) => (
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
};

const DashboardContent = ({ user }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState(new Date().toLocaleString());
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
    const updateDateTime = () => {
      setDateTime(new Date().toLocaleString());
    };
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
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

  // Format the date
  const weekday = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
  });
  const month = currentDate.toLocaleDateString(undefined, { month: "long" });
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();

  const formattedDate = `${weekday}, ${month} ${day}${getOrdinalSuffix(
    day
  )}, ${year}`;

  // Extract the time from the dateTime string
  const timenow = dateTime.split(",")[1].trim();

  // The wind direction
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

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header Section */}
      <Grid container spacing={3} mb={4}>
        {/* The change */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 4,
              backgroundColor: "#fdfdfd",
              borderRadius: 4,
              boxShadow: 2,
            }}
          >
            {loading ? (
              <Typography variant="body1">Please wait, loading...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <Grid container spacing={3} alignItems="center">
                {/* Left Content */}
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
                    Humidity: <strong>{weather.main.humidity}%</strong>, Wind:{" "}
                    <strong>{weather.wind.speed} km/h</strong> from the{" "}
                    <strong>{getWindDirection(weather.wind.deg)}</strong>.
                  </Typography>
                </Grid>

                {/* Weather Icon */}
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

      {/* Stat Section */}
      <Grid container spacing={4} sx={{ marginBottom: "50px" }}>
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
              { label: "Open", value: stats.activeProjectCount },
              { label: "Closed", value: stats.inactiveProjectCount },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Tasks"
            loading={statsLoading}
            data={[
              { label: "Completed", value: stats.taskCountCompleted },
              { label: "Total", value: stats.taskCount },
              { label: "Overdue", value: stats.taskCountOverdue },
              { label: "Due Today", value: stats.taskCountDueToday },
            ]}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardContent;
