"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  TableSortLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Card,
  CardContent,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import {
  Visibility as ViewIcon,
  Person as ProfileIcon,
  Assignment as ProjectsIcon,
  Task as TasksIcon,
  ExpandMore as ExpandMoreIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import EmployeeDetailsModal from "./EmployeeDetailsModal";
import ProjectAssignmentModal from "./ProjectAssignmentModal";
import EmployeeProjectsModal from "./EmployeeProjectsModal";
import CustomSnackbar from "./CustomSnackbar";
import { getToken } from "../utils/storage";

const AllEmployees = ({ user, onBack, onEmployeeCountChange }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assigningEmployee, setAssigningEmployee] = useState(null);
  const [viewingProjectsEmployee, setViewingProjectsEmployee] = useState(null);

  // Enhanced filtering and search
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [salaryRangeFilter, setSalaryRangeFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [viewMenuAnchor, setViewMenuAnchor] = useState(null);
  const [selectedEmployeeForMenu, setSelectedEmployeeForMenu] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  useEffect(() => {
    fetchEmployees();
  }, []);
  useEffect(() => {
    // Enhanced filtering with search, department, status, position, and salary range
    let filtered = employees;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((emp) => {
        const fullName =
          emp.firstName && emp.lastName
            ? `${emp.firstName} ${emp.lastName}`.toLowerCase()
            : "";
        const email = emp.email?.toLowerCase() || "";
        const employeeId = emp.employeeData?.employeeId?.toLowerCase() || "";
        const department = emp.employeeData?.department?.toLowerCase() || "";
        const position = emp.employeeData?.position?.toLowerCase() || "";
        const customPosition =
          emp.employeeData?.customPosition?.toLowerCase() || "";

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          employeeId.includes(query) ||
          department.includes(query) ||
          position.includes(query) ||
          customPosition.includes(query)
        );
      });
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.employeeData?.department === departmentFilter
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "Active";
      filtered = filtered.filter((emp) => emp.isActive === isActive);
    }

    // Position filter
    if (positionFilter !== "all") {
      filtered = filtered.filter((emp) => {
        const position = emp.employeeData?.position;
        if (positionFilter === "Others") {
          return (
            position === "Others" ||
            (position &&
              ![
                "Human Resource",
                "Team Leader",
                "Project Manager",
                "Senior Developer",
                "Junior Developer",
                "Quality Assurance",
                "Business Analyst",
                "Data Scientist",
                "UI/UX Designer",
                "System Administrator",
                "Network Engineer",
                "DevOps Engineer",
                "Technical Support",
                "Sales Executive",
                "Marketing Specialist",
                "Customer Service",
                "Trainee",
                "Student",
                "Intern",
              ].includes(position))
          );
        }
        return position === positionFilter;
      });
    }

    // Salary range filter
    if (salaryRangeFilter !== "all") {
      filtered = filtered.filter((emp) => {
        const salary = emp.employeeData?.salary || 0;
        switch (salaryRangeFilter) {
          case "0-30k":
            return salary >= 0 && salary <= 30000;
          case "30k-60k":
            return salary > 30000 && salary <= 60000;
          case "60k-100k":
            return salary > 60000 && salary <= 100000;
          case "100k+":
            return salary > 100000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = getSortValue(a, sortConfig.key);
        let bValue = getSortValue(b, sortConfig.key);

        // Handle numeric comparison (salary)
        if (sortConfig.key === "salary") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        // Handle string comparison (default)
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue, undefined, {
                numeric: true,
                sensitivity: "base",
              })
            : bValue.localeCompare(aValue, undefined, {
                numeric: true,
                sensitivity: "base",
              });
        }

        // Fallback comparison
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredEmployees(filtered);
  }, [
    employees,
    searchQuery,
    departmentFilter,
    statusFilter,
    positionFilter,
    salaryRangeFilter,
    sortConfig,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [
    searchQuery,
    departmentFilter,
    statusFilter,
    positionFilter,
    salaryRangeFilter,
    sortConfig,
  ]); // Helper function to get sortable value from employee object
  const getSortValue = (employee, key) => {
    switch (key) {
      case "employeeId":
        return employee.employeeData?.employeeId?.toLowerCase() || "zzz";
      case "name":
        const fullName =
          employee.firstName && employee.lastName
            ? `${employee.firstName} ${employee.lastName}`.toLowerCase()
            : "zzz";
        return fullName;
      case "email":
        return employee.email?.toLowerCase() || "";
      case "department":
        return employee.employeeData?.department?.toLowerCase() || "zzz";
      case "position":
        const position = employee.employeeData?.position;
        if (position === "Others") {
          const customPosition =
            employee.employeeData?.customPosition || employee.customPosition;
          return customPosition?.toLowerCase() || "zzz";
        }
        return position?.toLowerCase() || "zzz";
      case "salary":
        return employee.employeeData?.salary || 0; // Numeric sorting
      case "status":
        return employee.isActive ? "active" : "inactive";
      default:
        return "";
    }
  };
  // Handle sort click
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      // If clicking the same column, toggle direction
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    // If clicking a different column, always start with ascending
    setSortConfig({ key, direction });
  };
  const fetchEmployees = async () => {
    try {
      // Only access localStorage after component has mounted
      if (typeof window === "undefined") {
        setSnackbar({
          open: true,
          message: "Browser environment required",
          severity: "error",
        });
        return;
      }

      const token = getToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: "No authentication token",
          severity: "error",
        });
        return;
      }

      const response = await fetch("/api/management/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const userData = await response.json();
      // Filter only employees
      const employeeData = userData.filter((user) => user.role === "employee");
      setEmployees(employeeData);
      setFilteredEmployees(employeeData); // Initialize filtered employees
      setSnackbar({ open: false, message: "", severity: "info" }); // Clear any previous errors

      // Notify parent component about the updated active employee count
      if (onEmployeeCountChange) {
        const activeEmployeeCount = employeeData.filter(
          (emp) => emp.isActive !== false
        ).length;
        onEmployeeCountChange(activeEmployeeCount);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      if (!refreshing) {
        setLoading(false);
      }
    }
  };
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };
  const handleCloseModal = () => {
    setSelectedEmployee(null);
  };

  const handleEmployeeUpdate = () => {
    // Refresh employee data after an update
    setRefreshing(true);
    setSnackbar({
      open: true,
      message: "Employee updated successfully!",
      severity: "success",
    });
    fetchEmployees().finally(() => {
      setRefreshing(false);
    });
    setSelectedEmployee(null);
  };

  const handleAssignProject = (employee) => {
    setAssigningEmployee(employee);
  };

  const handleCloseAssignModal = () => {
    setAssigningEmployee(null);
  };

  const handleAssignmentSuccess = () => {
    // Could add a success message or refresh data if needed
    setAssigningEmployee(null);
  };

  // Enhanced filter functions
  const clearAllFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setPositionFilter("all");
    setSalaryRangeFilter("all");
    setSortConfig({ key: "name", direction: "asc" });
    setPage(0); // Reset pagination when clearing filters
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Memoize sorted employees to prevent unnecessary recalculations
  const sortedEmployees = useMemo(() => {
    if (!sortConfig.key) return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortConfig]);

  // Use the memoized sorted employees for pagination
  const paginatedEmployees = sortedEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get unique departments for filter dropdown
  const getUniqueDepartments = () => {
    const departments = employees
      .map((emp) => emp.employeeData?.department)
      .filter(Boolean);
    return [...new Set(departments)].sort();
  };

  // Get unique positions for filter dropdown
  const getUniquePositions = () => {
    const positions = employees
      .map((emp) => emp.employeeData?.position)
      .filter(Boolean);
    return [...new Set(positions)].sort();
  };

  // Get employee statistics for dashboard cards
  const getEmployeeStats = () => {
    const total = filteredEmployees.length;
    const active = filteredEmployees.filter((emp) => emp.isActive).length;
    const inactive = filteredEmployees.filter((emp) => !emp.isActive).length;
    const departments = new Set(
      filteredEmployees
        .map((emp) => emp.employeeData?.department)
        .filter(Boolean)
    ).size;

    return { total, active, inactive, departments };
  };

  const handleViewMenuOpen = (event, employee) => {
    event.stopPropagation();
    setViewMenuAnchor(event.currentTarget);
    setSelectedEmployeeForMenu(employee);
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchor(null);
    setSelectedEmployeeForMenu(null);
  };

  const handleViewProfile = () => {
    if (selectedEmployeeForMenu) {
      setSelectedEmployee(selectedEmployeeForMenu);
    }
    handleViewMenuClose();
  };

  const handleViewProjects = () => {
    if (selectedEmployeeForMenu) {
      setViewingProjectsEmployee(selectedEmployeeForMenu);
    }
    handleViewMenuClose();
  };

  if (loading) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "grey.50",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading employees...
          </Typography>
        </Paper>
      </Box>
    );
  }
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
            All Employees
          </Typography>
          {refreshing && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 2 }}>
              <CircularProgress size={20} color="primary" />
              <Typography variant="body2" color="text.secondary">
                Refreshing...
              </Typography>
            </Box>
          )}
        </Toolbar>{" "}
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ mb: 4, color: "primary.main" }}
        >
          Employee Management ({filteredEmployees.length}
          {employees.length !== filteredEmployees.length
            ? ` of ${employees.length}`
            : ""}
          )
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4, textAlign: "center" }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h4">{getEmployeeStats().total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h4" color="success.main">
                  {getEmployeeStats().active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Inactive
                </Typography>
                <Typography variant="h4" color="error.main">
                  {getEmployeeStats().inactive}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Departments
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {getEmployeeStats().departments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">Filters & Search</Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search employees"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, ID, department..."
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>

            {/* Department Filter */}
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

            {/* Status Filter */}
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

            {/* Position Filter */}
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

            {/* Salary Range Filter */}
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

            {/* Clear Filters Button */}
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

          {/* Active Filters Display */}
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
                  sx={{ pointerEvents: "none" }}
                />
              )}
              {departmentFilter !== "all" && (
                <Chip
                  label={`Department: ${departmentFilter}`}
                  onDelete={() => setDepartmentFilter("all")}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ pointerEvents: "none" }}
                />
              )}
              {statusFilter !== "all" && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  onDelete={() => setStatusFilter("all")}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ pointerEvents: "none" }}
                />
              )}
              {positionFilter !== "all" && (
                <Chip
                  label={`Position: ${positionFilter}`}
                  onDelete={() => setPositionFilter("all")}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ pointerEvents: "none" }}
                />
              )}
              {salaryRangeFilter !== "all" && (
                <Chip
                  label={`Salary: ${salaryRangeFilter}`}
                  onDelete={() => setSalaryRangeFilter("all")}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ pointerEvents: "none" }}
                />
              )}
            </Box>
          )}
        </Paper>
        {filteredEmployees.length === 0 && employees.length > 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No employees match the current filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try adjusting your search criteria or filter options to see more
              employees.
            </Typography>
            <Button variant="outlined" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </Paper>
        ) : filteredEmployees.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No employees found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are currently no employees in the system.
            </Typography>
          </Paper>
        ) : (
          <Box>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 3,
                borderRadius: 2,
                maxWidth: { xs: '100vw', md: 'calc(100vw - 290px)' }, //for the sidebar width
                overflowX: 'auto',
                marginLeft: { md: '0px' },
              }}
            >
              <Table sx={{ minWidth: 900 }} aria-label="employees table">
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "employeeId"}
                        direction={
                          sortConfig.key === "employeeId"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("employeeId")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Employee ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "name"}
                        direction={
                          sortConfig.key === "name"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("name")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "email"}
                        direction={
                          sortConfig.key === "email"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("email")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "department"}
                        direction={
                          sortConfig.key === "department"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("department")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Department
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "position"}
                        direction={
                          sortConfig.key === "position"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("position")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Position
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "salary"}
                        direction={
                          sortConfig.key === "salary"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("salary")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Salary
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      <TableSortLabel
                        active={sortConfig.key === "status"}
                        direction={
                          sortConfig.key === "status"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("status")}
                        sx={{
                          color: "white !important",
                          "&:hover": { color: "white !important" },
                        }}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "white" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEmployees.map((employee, index) => (
                    <TableRow
                      key={employee._id}
                      sx={{
                        "&:hover": {
                          bgcolor: "primary.50",
                        },
                        bgcolor: index % 2 === 0 ? "grey.50" : "white",
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {employee.employeeData?.employeeId || "Not assigned"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.firstName && employee.lastName
                            ? `${employee.firstName} ${employee.lastName}`
                            : "Name not provided"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {employee.employeeData?.department ? (
                          <Chip
                            label={employee.employeeData.department}
                            variant="outlined"
                            size="small"
                            color="primary"
                            sx={{ pointerEvents: "none" }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(() => {
                            const position = employee.employeeData?.position;
                            if (position === "Others") {
                              // Check for custom position in employeeData first, then fallback to the employee object
                              const customPosition =
                                employee.employeeData?.customPosition ||
                                employee.customPosition ||
                                // If position is not in predefined list, it's likely a custom position stored directly
                                (position !== "Others" &&
                                ![
                                  "Human Resource",
                                  "Team Leader",
                                  "Project Manager",
                                  "Senior Developer",
                                  "Junior Developer",
                                  "Quality Assurance",
                                  "Business Analyst",
                                  "Data Scientist",
                                  "UI/UX Designer",
                                  "System Administrator",
                                  "Network Engineer",
                                  "DevOps Engineer",
                                  "Technical Support",
                                  "Sales Executive",
                                  "Marketing Specialist",
                                  "Customer Service",
                                  "Trainee",
                                  "Student",
                                  "Intern",
                                ].includes(position)
                                  ? position
                                  : null);
                              return customPosition || "Not assigned";
                            }
                            return position || "Not assigned";
                          })()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {employee.employeeData?.salary
                            ? `₹${employee.employeeData.salary.toLocaleString()}`
                            : "Not disclosed"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.isActive ? "Active" : "Inactive"}
                          color={employee.isActive ? "success" : "error"}
                          variant="outlined"
                          size="small"
                          sx={{ pointerEvents: "none" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => handleViewMenuOpen(e, employee)}
                            endIcon={<ExpandMoreIcon />}
                            sx={{ minWidth: "auto", px: 2 }}
                          >
                            View
                          </Button>
                          <Tooltip title="Assign project">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignProject(employee);
                              }}
                              sx={{ minWidth: "auto", px: 2 }}
                            >
                              Assign
                            </Button>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredEmployees.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            />
          </Box>
        )}

        {/* View Options Menu */}
        <Menu
          anchorEl={viewMenuAnchor}
          open={Boolean(viewMenuAnchor)}
          onClose={handleViewMenuClose}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1,
              minWidth: 180,
              "& .MuiMenuItem-root": {
                px: 2,
                py: 1,
              },
            },
          }}
        >
          <MenuItem onClick={handleViewProfile}>
            <ListItemIcon>
              <ProfileIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleViewProjects}>
            <ListItemIcon>
              <ProjectsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Projects</ListItemText>
          </MenuItem>
        </Menu>
        {selectedEmployee && (
          <EmployeeDetailsModal
            employee={selectedEmployee}
            user={user}
            onClose={handleCloseModal}
            onEmployeeUpdate={handleEmployeeUpdate}
          />
        )}
        {assigningEmployee && (
          <ProjectAssignmentModal
            employee={assigningEmployee}
            open={!!assigningEmployee}
            onClose={handleCloseAssignModal}
            onSuccess={handleAssignmentSuccess}
          />
        )}
        {viewingProjectsEmployee && (
          <EmployeeProjectsModal
            employee={viewingProjectsEmployee}
            open={!!viewingProjectsEmployee}
            onClose={() => setViewingProjectsEmployee(null)}
          />
        )}

        <CustomSnackbar
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      </Container>
    </Box>
  );
};

export default AllEmployees;
