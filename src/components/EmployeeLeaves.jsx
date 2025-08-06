"use client";

import { useState, useEffect } from "react";
import { Box, Typography, AppBar, Toolbar, IconButton } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { getToken } from "../utils/storage";

const EmployeeLeaves = ({ user, onBack }) => {
  return (
    <Box sx={{ flexGrow: 1, bgcolor: "grey.50", minHeight: "100vh" }}>
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
            Leave Balances
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 4 }}>
        <Typography variant="body1" color="text.secondary">
          This is the employee side Leave page. Features will be added soon.
        </Typography>
      </Box>
    </Box>
  );
};

export default EmployeeLeaves;