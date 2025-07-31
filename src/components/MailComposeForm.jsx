import React from "react";
import { Box, Paper, Typography, Alert, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button, Autocomplete, Chip, CircularProgress } from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";

const MailComposeForm = ({
  formData,
  handleFormChange,
  handlePositionChange,
  resetForm,
  handleSendMail,
  sending,
  requestTypes,
  priorities,
  leaveTypes,
  sessionOptions,
  availableDepartments,
  getFilteredPositions,
  getAvailableCCPositions,
}) => (
  <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
      <MailIcon color="primary" />
      <Typography variant="h6" color="primary.main">
        Compose Internal Request
      </Typography>
    </Box>
    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="body2">
        <strong>Cross-Department Mailing:</strong> First select a department to see positions for the main recipient ("Send To Position"). For CC positions, you can select from any department - they will accumulate as you switch between departments. The main recipient must be from the currently selected department, while CC recipients can be from multiple departments.
      </Typography>
    </Alert>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl sx={{ width: "15vw" }} required>
          <InputLabel>Request Type</InputLabel>
          <Select
            name="requestType"
            value={formData.requestType}
            onChange={handleFormChange}
            label="Request Type"
          >
            {requestTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {formData.requestType !== "Leave Application" && formData.requestType !== "Work from Home" && (
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleFormChange}
              label="Priority"
            >
              {priorities.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      <Grid item xs={12}>
        <TextField
          sx={{ width: "40vw" }}
          name="subject"
          label="Subject"
          value={formData.subject}
          onChange={handleFormChange}
          placeholder="Brief description of your request"
          required
        />
      </Grid>
      {/* Leave Application Specific Fields */}
      {formData.requestType === "Leave Application" && (
        <>
          <Grid item xs={12} md={6}>
            <FormControl sx={{ width: "13.5vw"}} required>
              <InputLabel>Leave Type</InputLabel>
              <Select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleFormChange}
                label="Leave Type"
              >
                {leaveTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              name="fromDate"
              label="From Date"
              value={formData.fromDate}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
              inputProps={{
                min: new Date().toISOString().split("T")[0],
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>From Session</InputLabel>
              <Select
                name="fromSession"
                value={formData.fromSession}
                onChange={handleFormChange}
                label="From Session"
              >
                {sessionOptions.map((session) => (
                  <MenuItem key={session.value} value={session.value}>
                    {session.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              name="toDate"
              label="To Date"
              value={formData.toDate}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
              inputProps={{
                min: formData.fromDate || new Date().toISOString().split("T")[0],
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>To Session</InputLabel>
              <Select
                name="toSession"
                value={formData.toSession}
                onChange={handleFormChange}
                label="To Session"
              >
                {sessionOptions.map((session) => (
                  <MenuItem key={session.value} value={session.value}>
                    {session.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </>
      )}
      {/* Work from Home Specific Fields */}
      {formData.requestType === "Work from Home" && (
        <>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              name="wfhFromDate"
              label="From Date"
              value={formData.wfhFromDate}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
              inputProps={{
                min: new Date().toISOString().split("T")[0],
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              name="wfhToDate"
              label="To Date"
              value={formData.wfhToDate}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
              inputProps={{
                min: formData.wfhFromDate || new Date().toISOString().split("T")[0],
              }}
            />
          </Grid>
        </>
      )}
      {/* Department Selection - Required First */}
      <Grid item xs={12}>
        <FormControl sx={{ minWidth: "20vw" }} required>
          <InputLabel>Department </InputLabel>
          <Select
            name="selectedDepartment"
            value={formData.selectedDepartment}
            onChange={handleFormChange}
            label="Department"
          >
            {availableDepartments.map((dept) => (
              <MenuItem key={dept._id} value={dept.department}>
                {dept.department}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {/* Show message when no department selected */}
      {!formData.selectedDepartment && (
        <Grid item xs={12}>
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              Please select a department above to see available positions for that department.
            </Typography>
          </Alert>
        </Grid>
      )}
      {/* Position and CC fields - Only show when department is selected */}
      {formData.selectedDepartment && (
        <>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={getFilteredPositions()}
              getOptionLabel={(option) => option.position}
              value={formData.selectedPosition}
              onChange={(event, newValue) => handlePositionChange("selectedPosition", newValue)}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Send To Position *"
                  placeholder="Select position to send to"
                  required={!formData.selectedPosition}
                  helperText={`Positions available in ${formData.selectedDepartment} department`}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ minWidth: "66vw" }}>
            <Autocomplete
              multiple
              options={getAvailableCCPositions()}
              getOptionLabel={(option) => `${option.position} (${option.departmentName})`}
              value={formData.ccPositions}
              onChange={(event, newValue) => handlePositionChange("ccPositions", newValue)}
              isOptionEqualToValue={(option, value) => option.uniqueId === value.uniqueId}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={`${option.position} (${option.departmentName})`}
                    {...getTagProps({ index })}
                    key={option.uniqueId}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="CC Positions (Optional)"
                  placeholder="Select positions to CC from any department"
                  helperText="You can select positions from any department for CC"
                />
              )}
            />
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <TextField
          sx={{ minWidth: "66vw" }}
          fullWidth
          name="message"
          label="Message"
          value={formData.message}
          onChange={handleFormChange}
          placeholder="Provide detailed information about your request..."
          multiline
          rows={4}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button onClick={resetForm} disabled={sending} sx={{ minWidth: 100 }}>
            Reset
          </Button>
          <Button
            onClick={handleSendMail}
            variant="contained"
            startIcon={sending ? <CircularProgress size={20} /> : <MailIcon />}
            disabled={sending}
            sx={{ minWidth: 120 }}
          >
            {sending ? "Sending..." : "Send Mail"}
          </Button>
        </Box>
      </Grid>
    </Grid>
  </Paper>
);

export default MailComposeForm;
