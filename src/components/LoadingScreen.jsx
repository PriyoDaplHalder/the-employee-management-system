"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import { HashLoader} from "react-spinners";

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
      <HashLoader
        color="#26c1f3"
        size={75}
      />
      </Box>
    </Box>
  );
};

export default LoadingScreen;
