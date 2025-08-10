"use client";

import { useState, useEffect } from "react";

import AttendanceCalendar from "./AttendanceCalendar";
import AttendanceDetails from "./AttendanceDetails";
import { Typography, Box, AppBar, Toolbar, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import AppBar from "@mui/material/AppBar";

const EmployeeAttendance = ({ user, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Keep the AppBar unchanged as requested */}
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
            Attendance
          </Typography>
        </Toolbar>
      </AppBar>

      {/* New improved layout */}
      <Box
        sx={{
          display: "flex",
          gap: 4,
          p: 4,
          maxWidth: 1400,
          mx: "auto",
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        {/* Calendar Section */}
        <Box sx={{ flex: 2, minWidth: 0 }}>
          <AttendanceCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </Box>

        {/* Details Section */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <AttendanceDetails selectedDate={selectedDate} />
        </Box>
      </Box>
    </Box>
  );
};

export default EmployeeAttendance;
