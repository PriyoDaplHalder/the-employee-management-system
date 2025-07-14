"use client";
import { useState } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import CustomSnackbar from "./CustomSnackbar";

const ForgotPasswordForm = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(0); // 0: Email, 1: OTP & New Password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = ["Enter Email", "Verify & Reset"];

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length > 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    // Block curly braces for SQL injection prevention
    const hasCurlyBraces = /[{}]/.test(password);

    return {
      isValid:
        minLength && hasLowerCase && hasUpperCase && hasNumber && hasSymbol && !hasCurlyBraces,
      errors: {
        minLength,
        hasLowerCase,
        hasUpperCase,
        hasNumber,
        hasSymbol,
        hasCurlyBraces,
      },
    };
  };

  const validateOTP = (otp) => {
    return /^\d{6}$/.test(otp);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    setEmailError("");
    
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleOTPChange = (e) => {
    const otp = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData({ ...formData, otp });
    setOtpError("");
    
    if (otp && !validateOTP(otp)) {
      setOtpError("OTP must be exactly 6 digits");
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData({ ...formData, newPassword: password });
    setPasswordError("");
    setConfirmPasswordError("");
    
    if (password) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        const missingRequirements = [];
        if (!validation.errors.minLength)
          missingRequirements.push("7 characters");
        if (!validation.errors.hasLowerCase)
          missingRequirements.push("1 lowercase letter");
        if (!validation.errors.hasUpperCase)
          missingRequirements.push("1 uppercase letter");
        if (!validation.errors.hasNumber)
          missingRequirements.push("1 number");
        if (!validation.errors.hasSymbol)
          missingRequirements.push("1 symbol");
        if (validation.errors.hasCurlyBraces)
          missingRequirements.push("no curly braces { or }");
        setPasswordError(`Password must contain at least ${missingRequirements.join(", ")}`);
      }
    }
    
    // Check confirm password if it exists
    if (formData.confirmPassword && password !== formData.confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPassword = e.target.value;
    setFormData({ ...formData, confirmPassword });
    setConfirmPasswordError("");
    
    if (confirmPassword && confirmPassword !== formData.newPassword) {
      setConfirmPasswordError("Passwords do not match");
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate email
    if (!validateEmail(formData.email)) {
      setSnackbar({
        open: true,
        message: "Please enter a valid email address",
        severity: "error",
      });
      setEmailError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: data.message,
          severity: "success",
        });
        setStep(1);
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Failed to send verification code",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields
    if (!validateOTP(formData.otp)) {
      setSnackbar({
        open: true,
        message: "Please enter a valid 6-digit verification code",
        severity: "error",
      });
      setOtpError("Please enter a valid 6-digit verification code");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.newPassword).isValid) {
      setSnackbar({
        open: true,
        message: "Please enter a valid password",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      setConfirmPasswordError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: data.message,
          severity: "success",
        });
        // Wait a moment then redirect to login
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Failed to reset password",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewOTP = () => {
    setStep(0);
    setFormData({
      ...formData,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
    setOtpError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "grey.50",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 600, color: "primary.main" }}
              >
                Reset Password
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Employee Management System
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={step} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 0: Email Input */}
            {step === 0 && (
              <Box component="form" onSubmit={handleRequestOTP} sx={{ mt: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your registered email address to receive a verification code.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  variant="outlined"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError || "Enter your registered email address"}
                  disabled={loading}
                  sx={{ mb: 4 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !!emailError || !formData.email}
                  sx={{
                    py: 2,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </Box>
            )}

            {/* Step 1: OTP and New Password */}
            {step === 1 && (
              <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Enter the 6-digit verification code sent to <strong>{formData.email}</strong> and your new password.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Verification Code"
                  name="otp"
                  type="text"
                  required
                  variant="outlined"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={handleOTPChange}
                  error={!!otpError}
                  helperText={otpError || "Enter the 6-digit code from your email"}
                  disabled={loading}
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.5rem" }
                  }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  variant="outlined"
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  error={!!passwordError}
                  helperText={passwordError || "At least 7 characters, 1 lowercase, 1 uppercase, 1 number, 1 symbol"}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  variant="outlined"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError || "Re-enter your new password"}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={toggleConfirmPasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 4 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={
                    loading ||
                    !!otpError ||
                    !!passwordError ||
                    !!confirmPasswordError ||
                    !formData.otp ||
                    !formData.newPassword ||
                    !formData.confirmPassword
                  }
                  sx={{
                    py: 2,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                {/* Request New Code */}
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Did not receive the code?
                  </Typography>
                  <Button
                    variant="text"
                    onClick={handleRequestNewOTP}
                    disabled={loading}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Request New Code
                  </Button>
                </Box>
              </Box>
            )}

            {/* Back Button */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                disabled={loading}
                sx={{ textTransform: "none" }}
              >
                Back to Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default ForgotPasswordForm;
