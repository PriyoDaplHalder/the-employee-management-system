import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Chip,
} from "@mui/material";
import moment from "moment";

const AttendanceDetails = ({ selectedDate }) => {
  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        height: "fit-content",
        bgcolor: "#fff",
        border: "1px solid #e0e0e0",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}
        >
          Selected Date
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {selectedDate ? (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              {moment(selectedDate).format("dddd, MMMM D, YYYY")}
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  1st Session:
                </Typography>
                <Chip
                  label="No data"
                  size="small"
                  sx={{ bgcolor: "grey.100" }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  2nd Session:
                </Typography>
                <Chip
                  label="No data"
                  size="small"
                  sx={{ bgcolor: "grey.100" }}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Click a day on the calendar to view attendance details.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceDetails;
