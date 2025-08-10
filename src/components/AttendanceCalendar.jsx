import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const localizer = momentLocalizer(moment);

const AttendanceCalendar = ({ selectedDate, setSelectedDate }) => {
  const events = [];
  const [currentDate, setCurrentDate] = useState(moment());

  // Custom day cell to split into two sessions visually
  const CustomDateCell = ({ children }) => (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: "primary.50",
          transform: "scale(1.02)",
        },
      }}
    >
      <Box
        sx={{
          flex: 1,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "rgba(76, 175, 80, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: 9,
            fontWeight: 600,
            color: "primary.dark",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          1st
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          bgcolor: "rgba(33, 150, 243, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: 9,
            fontWeight: 600,
            color: "info.dark",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          2nd
        </Typography>
      </Box>
      {children}
    </Box>
  );

  // Calendar navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => moment(prev).subtract(1, "month"));
  };
  const handleNextMonth = () => {
    setCurrentDate((prev) => moment(prev).add(1, "month"));
  };
  const handleToday = () => {
    setCurrentDate(moment());
    setSelectedDate(moment().toDate());
  };

  // Handle day click
  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
  };

  // Custom toolbar for navigation
  const CustomToolbar = (toolbar) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          aria-label="Previous Month"
          onClick={() => {
            handlePrevMonth();
            toolbar.onNavigate("PREV");
          }}
        >
          <ArrowBackIosIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {moment(currentDate).format("MMMM YYYY")}
        </Typography>
        <IconButton
          aria-label="Next Month"
          onClick={() => {
            handleNextMonth();
            toolbar.onNavigate("NEXT");
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Button variant="outlined" size="small" onClick={handleToday}>
        Today
      </Button>
    </Box>
  );

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#fff",
        border: "1px solid #e0e0e0",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{
            height: 400,
            fontFamily: "inherit",
            borderRadius: 8,
            background: "#fff",
          }}
          views={["month"]}
          components={{
            dateCellWrapper: CustomDateCell,
            toolbar: CustomToolbar,
          }}
          date={currentDate.toDate()}
          onNavigate={(date) => setCurrentDate(moment(date))}
          selectable
          onSelectSlot={handleSelectSlot}
          popup
          dayPropGetter={({ date }) => ({
            style: {
              backgroundColor: moment(date).isSame(moment(), "day")
                ? "#e3f2fd"
                : "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              margin: 2,
            },
          })}
        />
      </CardContent>
    </Card>
  );
};

export default AttendanceCalendar;
