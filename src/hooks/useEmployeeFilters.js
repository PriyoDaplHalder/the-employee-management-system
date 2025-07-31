import { useState, useEffect, useMemo } from "react";

const useEmployeeFilters = (employees) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [salaryRangeFilter, setSalaryRangeFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getSortValue = (employee, key) => {
    switch (key) {
      case "employeeId":
        return employee.employeeData?.employeeId?.toLowerCase() || "zzz";
      case "name":
        return employee.firstName && employee.lastName
          ? `${employee.firstName} ${employee.lastName}`.toLowerCase()
          : "zzz";
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
        return employee.employeeData?.salary || 0;
      case "status":
        return employee.isActive ? "active" : "inactive";
      default:
        return "";
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setPositionFilter("all");
    setSalaryRangeFilter("all");
    setSortConfig({ key: "name", direction: "asc" });
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [searchQuery, departmentFilter, statusFilter, positionFilter, salaryRangeFilter, sortConfig]);

  const filteredEmployees = useMemo(() => {
    let filtered = employees;
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
        const customPosition = emp.employeeData?.customPosition?.toLowerCase() || "";
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
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.employeeData?.department === departmentFilter
      );
    }
    if (statusFilter !== "all") {
      const isActive = statusFilter === "Active";
      filtered = filtered.filter((emp) => emp.isActive === isActive);
    }
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
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = getSortValue(a, sortConfig.key);
        let bValue = getSortValue(b, sortConfig.key);
        if (sortConfig.key === "salary") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" })
            : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: "base" });
        }
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [employees, searchQuery, departmentFilter, statusFilter, positionFilter, salaryRangeFilter, sortConfig]);

  const paginatedEmployees = useMemo(
    () => filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredEmployees, page, rowsPerPage]
  );

  return {
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
    setSortConfig,
    handleSort,
    clearAllFilters,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    filteredEmployees,
    paginatedEmployees,
  };
};

export default useEmployeeFilters;
