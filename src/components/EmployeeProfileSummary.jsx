import React from "react";
import { Grid, Typography, Chip } from "@mui/material";

const EmployeeProfileSummary = ({ formData, renderSkills }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">First Name</Typography>
      <Typography variant="body1">{formData.firstName}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Last Name</Typography>
      <Typography variant="body1">{formData.lastName}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Employee ID</Typography>
      <Typography variant="body1">{formData.employeeId}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Department</Typography>
      <Typography variant="body1">{formData.department}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Position</Typography>
      <Typography variant="body1">
        {formData.position === "Others"
          ? formData.customPosition
          : formData.position}
      </Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Salary</Typography>
      <Typography variant="body1">{formData.salary}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Hire Date</Typography>
      <Typography variant="body1">{formData.hireDate}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Phone</Typography>
      <Typography variant="body1">{formData.phone}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Address</Typography>
      <Typography variant="body1">{formData.address}</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography variant="subtitle2">Emergency Contact</Typography>
      <Typography variant="body1">{formData.emergencyContact}</Typography>
    </Grid>
    <Grid item xs={12}>
      <Typography variant="subtitle2">Skills</Typography>
      {renderSkills ? renderSkills() : <Typography variant="body1">{formData.skills}</Typography>}
    </Grid>
  </Grid>
);

export default EmployeeProfileSummary;
