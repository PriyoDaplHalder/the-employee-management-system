"use client";
import { useState } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

const LoginForm = ({ userType, isSignup, onToggleMode, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // string+@+domain+.+extension
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length > 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return {
      isValid: minLength && hasLowerCase && hasUpperCase && hasNumber && hasSymbol,
      errors: {
        minLength,
        hasLowerCase,
        hasUpperCase,
        hasNumber,
        hasSymbol
      }
    };
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    // Clear previous email error
    setEmailError("");
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    // Validate email
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setEmailError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (isSignup) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        const missingRequirements = [];
        if (!passwordValidation.errors.minLength) missingRequirements.push("6 characters");
        if (!passwordValidation.errors.hasLowerCase) missingRequirements.push("1 lowercase letter");
        if (!passwordValidation.errors.hasUpperCase) missingRequirements.push("1 uppercase letter");
        if (!passwordValidation.errors.hasNumber) missingRequirements.push("1 number");
        if (!passwordValidation.errors.hasSymbol) missingRequirements.push("1 symbol");

        setError(`Password must contain at least ${missingRequirements.join(", ")}`);
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup 
        ? { ...formData, role: userType } 
        : { email: formData.email, password: formData.password, rememberMe: formData.rememberMe };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          email: formData.email,
          role: isSignup ? userType : data.user?.role || userType,
          ...data.user,
        };
        onSubmit(data.token, userData, isSignup ? false : formData.rememberMe);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
                {isSignup ? "Create Account" : "Sign In"}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ textTransform: "capitalize" }}
              >
                {userType} Portal
              </Typography>
            </Box>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
                helperText={emailError || "Enter a valid email address"}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                variant="outlined"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                helperText={
                  isSignup ? ">6 character, 1(lowercase, uppercase, number, symbol)" : ""
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 4 }}
              />

              {/* Remember Me Checkbox */}
              {!isSignup && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        setFormData({ ...formData, rememberMe: e.target.checked })
                      }
                      disabled={loading}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Remember me
                    </Typography>
                  }
                  sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
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
                    <CircularProgress
                      size={20}
                      sx={{ mr: 1, color: "white" }}
                    />
                    {isSignup ? "Creating Account..." : "Signing In..."}
                  </>
                ) : isSignup ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>

              <Divider sx={{ my: 2 }} />

              {/* Toggle Mode */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {isSignup
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </Typography>
                <Button
                  variant="text"
                  onClick={onToggleMode}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </Button>
              </Box>

              {/* Back Button */}
              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={onBack}
                  sx={{ textTransform: "none" }}
                >
                  Back to Portal Selection
                </Button>
              </Box>
            </Box>{" "}
          </CardContent>
        </Card>
      </Container>{" "}
    </Box>
  );
};

export default LoginForm;
