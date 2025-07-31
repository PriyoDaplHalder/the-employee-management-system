import React from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";

const EmployeeProfileForm = ({
  formData,
  handleChange,
  isFieldEditable,
  getFieldHelperText,
  predefinedPositions,
  showCustomPosition,
  isManagement,
  onSubmit,
  loading,
  isFirstTimeCreation,
  profileExists,
  profileCompleted,
}) => (
  <form onSubmit={onSubmit}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("firstName")}
          helperText={getFieldHelperText("firstName")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("lastName")}
          helperText={getFieldHelperText("lastName")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Employee ID"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          fullWidth
          disabled
          helperText="Auto-generated or assigned by management"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Department</InputLabel>
          <Select
            name="department"
            value={formData.department}
            onChange={handleChange}
            disabled={!isFieldEditable("department")}
            label="Department"
          >
            <MenuItem value="">Select Department</MenuItem>
            <MenuItem value="HR">HR</MenuItem>
            <MenuItem value="Engineering">Engineering</MenuItem>
            <MenuItem value="Sales">Sales</MenuItem>
            <MenuItem value="Marketing">Marketing</MenuItem>
            <MenuItem value="Finance">Finance</MenuItem>
            <MenuItem value="General">General</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Position</InputLabel>
          <Select
            name="position"
            value={formData.position}
            onChange={handleChange}
            disabled={!isFieldEditable("position")}
            label="Position"
          >
            {predefinedPositions.map((pos) => (
              <MenuItem key={pos} value={pos}>{pos}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {showCustomPosition && (
        <Grid item xs={12} sm={6}>
          <TextField
            label="Custom Position"
            name="customPosition"
            value={formData.customPosition}
            onChange={handleChange}
            fullWidth
            disabled={!isFieldEditable("position")}
            helperText={getFieldHelperText("position")}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Salary"
          name="salary"
          value={formData.salary}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("salary")}
          helperText={getFieldHelperText("salary")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Hire Date"
          name="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          disabled={!isFieldEditable("hireDate")}
          helperText={getFieldHelperText("hireDate")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("phone")}
          helperText={getFieldHelperText("phone")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("address")}
          helperText={getFieldHelperText("address")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Emergency Contact"
          name="emergencyContact"
          value={formData.emergencyContact}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("emergencyContact")}
          helperText={getFieldHelperText("emergencyContact")}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Skills (comma separated)"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          fullWidth
          disabled={!isFieldEditable("skills")}
          helperText={getFieldHelperText("skills")}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {isFirstTimeCreation || !profileExists ? "Create Profile" : profileCompleted ? "Update Profile" : "Complete Profile"}
        </Button>
      </Grid>
    </Grid>
  </form>
);

export default EmployeeProfileForm;
