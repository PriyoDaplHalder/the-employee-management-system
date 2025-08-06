import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  Grid,
  CircularProgress,
  Divider,
} from "@mui/material";
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getToken } from "../utils/storage";
import HelloMessageCard from "./HelloMessageCard";

const COLORS = ["#1976d2", "#bfbfbf", "#F39C12", "#ff9800"];
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

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <HelloMessageCard user={user} />
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
