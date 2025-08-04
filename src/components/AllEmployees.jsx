"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import {
  Person as ProfileIcon,
  Assignment as ProjectsIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import EmployeeDetailsModal from "./EmployeeDetailsModal";
import ProjectAssignmentModal from "./ProjectAssignmentModal";
import EmployeeProjectsModal from "./EmployeeProjectsModal";
import CustomSnackbar from "./CustomSnackbar";
import { getToken } from "../utils/storage";
import useDragScroll from "../hooks/useDragScroll";
import EmployeeStatsCards from "./ManagementEmployeeStatsCards";
import EmployeeFilters from "./ManagementEmployeeFilters";
import EmployeeTable from "./ManagementEmployeeTable";
import useEmployeeFilters from "../hooks/useEmployeeFilters";

const AllEmployees = ({ user, onBack, onEmployeeCountChange }) => {
  const [employees, setEmployees] = useState([]);
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
  const [viewMenuAnchor, setViewMenuAnchor] = useState(null);
  const [selectedEmployeeForMenu, setSelectedEmployeeForMenu] = useState(null);
  // Drag-to-scroll ref
  const dragScrollRef = useDragScroll();

  // Use custom hook for filters, sorting, pagination
  const {
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
    sortConfig,
    handleSort,
    clearAllFilters,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    filteredEmployees,
    paginatedEmployees,
  } = useEmployeeFilters(employees);

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
    const total = employees.length;
    const active = employees.filter((emp) => emp.isActive).length;
    const inactive = employees.filter((emp) => !emp.isActive).length;
    const departments = new Set(
      employees
        .map((emp) => emp.employeeData?.department)
        .filter(Boolean)
    ).size;
    return { total, active, inactive, departments };
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
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
      const employeeData = userData.filter((user) => user.role === "employee");
      setEmployees(employeeData);
      setSnackbar({ open: false, message: "", severity: "info" });
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

  // Modal and menu handlers (unchanged)
  const handleEmployeeClick = (employee) => setSelectedEmployee(employee);
  const handleCloseModal = () => setSelectedEmployee(null);
  const handleEmployeeUpdate = () => {
    setRefreshing(true);
    setSnackbar({
      open: true,
      message: "Employee updated successfully!",
      severity: "success",
    });
    fetchEmployees().finally(() => setRefreshing(false));
    setSelectedEmployee(null);
  };
  const handleAssignProject = (employee) => setAssigningEmployee(employee);
  const handleCloseAssignModal = () => setAssigningEmployee(null);
  const handleAssignmentSuccess = () => setAssigningEmployee(null);
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
    if (selectedEmployeeForMenu) setSelectedEmployee(selectedEmployeeForMenu);
    handleViewMenuClose();
  };
  const handleViewProjects = () => {
    if (selectedEmployeeForMenu) setViewingProjectsEmployee(selectedEmployeeForMenu);
    handleViewMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: "grey.50", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      <AppBar position="static" elevation={0} sx={{ bgcolor: "transparent", borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar>
          <IconButton edge="start" color="primary" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "text.primary" }}>
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
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 1, color: "primary.main" }}>
          Employee Management ({filteredEmployees.length}
          {employees.length !== filteredEmployees.length ? ` of ${employees.length}` : ""})
        </Typography>
        {/* Statistics Cards */}
        <EmployeeStatsCards stats={getEmployeeStats()} />
        {/* Enhanced Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <EmployeeFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            positionFilter={positionFilter}
            setPositionFilter={setPositionFilter}
            salaryRangeFilter={salaryRangeFilter}
            setSalaryRangeFilter={setSalaryRangeFilter}
            clearAllFilters={clearAllFilters}
            getUniqueDepartments={getUniqueDepartments}
            getUniquePositions={getUniquePositions}
          />
        </Paper>
        {filteredEmployees.length === 0 && employees.length > 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No employees match the current filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try adjusting your search criteria or filter options to see more employees.
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
          <EmployeeTable
            employees={paginatedEmployees}
            sortConfig={sortConfig}
            handleSort={handleSort}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={(e, newPage) => setPage(newPage)}
            handleChangeRowsPerPage={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            dragScrollRef={dragScrollRef}
            handleViewMenuOpen={handleViewMenuOpen}
            handleAssignProject={handleAssignProject}
            totalCount={filteredEmployees.length}
          />
        )}
        {/* View Options Menu and Modals (unchanged) */}
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
              "& .MuiMenuItem-root": { px: 2, py: 1 },
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
