import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip, Button, Tooltip, TableSortLabel, TablePagination } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

const EmployeeTable = ({
  employees,
  sortConfig,
  handleSort,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  dragScrollRef,
  handleViewMenuOpen,
  handleAssignProject,
}) => (
  <Box>
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: 3,
        borderRadius: 2,
        maxWidth: { xs: '100vw', md: 'calc(100vw - 290px)' },
        overflowX: 'auto',
        marginLeft: { md: '0px' },
        cursor: 'grab',
        WebkitOverflowScrolling: 'touch',
      }}
      ref={dragScrollRef}
    >
      <Table sx={{ minWidth: 900 }} aria-label="employees table">
        <TableHead>
          <TableRow sx={{ bgcolor: "primary.main" }}>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "employeeId"}
                direction={sortConfig.key === "employeeId" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("employeeId")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
              >
                Employee ID
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "name"}
                direction={sortConfig.key === "name" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("name")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "email"}
                direction={sortConfig.key === "email" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("email")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
              >
                Email
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "department"}
                direction={sortConfig.key === "department" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("department")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
              >
                Department
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "position"}
                direction={sortConfig.key === "position" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("position")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
              >
                Position
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "salary"}
                direction={sortConfig.key === "salary" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("salary")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
              >
                Salary
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>
              <TableSortLabel
                active={sortConfig.key === "status"}
                direction={sortConfig.key === "status" ? sortConfig.direction : "asc"}
                onClick={() => handleSort("status")}
                sx={{ color: "white !important", "&:hover": { color: "white !important" } }}
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
          {employees.map((employee, index) => (
            <TableRow
              key={employee._id}
              sx={{
                "&:hover": { bgcolor: "primary.50" },
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
                      const customPosition =
                        employee.employeeData?.customPosition ||
                        employee.customPosition;
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
    <TablePagination
      rowsPerPageOptions={[5, 10, 25, 50]}
      component="div"
      count={employees.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      sx={{ borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}
    />
  </Box>
);

export default EmployeeTable;
