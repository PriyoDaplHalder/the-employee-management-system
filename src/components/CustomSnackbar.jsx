"use client";

import { Snackbar, Alert, Slide } from "@mui/material";

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

const CustomSnackbar = ({
  open,
  onClose,
  message,
  severity = "info",
  autoHideDuration = 3000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          boxShadow: 3,
          borderRadius: 2,
          fontWeight: 500,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
