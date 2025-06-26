"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import { PacmanLoader } from "react-spinners";

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <PacmanLoader
          color="#45b3f1"
          margin={2}
          size={35}
        />
      </Box>
    </Box>
  );
};

export default LoadingScreen;
