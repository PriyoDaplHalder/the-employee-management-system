import { Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button, Typography, Chip } from "@mui/material";
import { FilterList as FilterListIcon, Clear as ClearIcon, Search as SearchIcon } from "@mui/icons-material";

const EmployeeFilters = ({
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
  positionFilter,
  setPositionFilter,
  salaryRangeFilter,
  setSalaryRangeFilter,
  clearAllFilters,
  getUniqueDepartments,
  getUniquePositions,
}) => (
  <Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <FilterListIcon color="primary" />
      <Typography variant="h6">Filters & Search</Typography>
    </Box>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          size="small"
          label="Search employees"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Name, email, ID, department..."
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Department</InputLabel>
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            label="Department"
          >
            <MenuItem value="all">All Departments</MenuItem>
            {getUniqueDepartments().map((department) => (
              <MenuItem key={department} value={department}>
                {department}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Position</InputLabel>
          <Select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            label="Position"
          >
            <MenuItem value="all">All Positions</MenuItem>
            {getUniquePositions().map((position) => (
              <MenuItem key={position} value={position}>
                {position}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Salary Range</InputLabel>
          <Select
            value={salaryRangeFilter}
            onChange={(e) => setSalaryRangeFilter(e.target.value)}
            label="Salary Range"
          >
            <MenuItem value="all">All Ranges</MenuItem>
            <MenuItem value="0-30k">₹0 - ₹30,000</MenuItem>
            <MenuItem value="30k-60k">₹30,001 - ₹60,000</MenuItem>
            <MenuItem value="60k-100k">₹60,001 - ₹1,00,000</MenuItem>
            <MenuItem value="100k+">₹1,00,000+</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={1}>
        <Button
          fullWidth
          variant="outlined"
          onClick={clearAllFilters}
          startIcon={<ClearIcon />}
          sx={{ height: "40px" }}
          disabled={
            searchQuery === "" &&
            departmentFilter === "all" &&
            statusFilter === "all" &&
            positionFilter === "all" &&
            salaryRangeFilter === "all"
          }
        >
          Clear
        </Button>
      </Grid>
    </Grid>
    {(searchQuery ||
      departmentFilter !== "all" ||
      statusFilter !== "all" ||
      positionFilter !== "all" ||
      salaryRangeFilter !== "all") && (
      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Active filters:
        </Typography>
        {searchQuery && (
          <Chip
            label={`Search: "${searchQuery}"`}
            onDelete={() => setSearchQuery("")}
            size="small"
            color="primary"
            variant="outlined"
            // sx={{ pointerEvents: "none" }}
          />
        )}
        {departmentFilter !== "all" && (
          <Chip
            label={`Department: ${departmentFilter}`}
            onDelete={() => setDepartmentFilter("all")}
            size="small"
            color="primary"
            variant="outlined"
            // sx={{ pointerEvents: "none" }}
          />
        )}
        {statusFilter !== "all" && (
          <Chip
            label={`Status: ${statusFilter}`}
            onDelete={() => setStatusFilter("all")}
            size="small"
            color="primary"
            variant="outlined"
            // sx={{ pointerEvents: "none" }}
          />
        )}
        {positionFilter !== "all" && (
          <Chip
            label={`Position: ${positionFilter}`}
            onDelete={() => setPositionFilter("all")}
            size="small"
            color="primary"
            variant="outlined"
            // sx={{ pointerEvents: "none" }}
          />
        )}
        {salaryRangeFilter !== "all" && (
          <Chip
            label={`Salary: ${salaryRangeFilter}`}
            onDelete={() => setSalaryRangeFilter("all")}
            size="small"
            color="primary"
            variant="outlined"
            // sx={{ pointerEvents: "none" }}
          />
        )}
      </Box>
    )}
  </Box>
);

export default EmployeeFilters;
