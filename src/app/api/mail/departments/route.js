import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Employee } from "@/model/Employee";
import { User } from "@/model/User";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Get departments with their positions for mail system
export async function GET(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Get all active employees with their positions and departments
    const employees = await Employee.find({ isActive: true })
      .select('department position')
      .sort({ department: 1, position: 1 });

    // Group positions by department
    const departmentPositions = {};
    
    employees.forEach(employee => {
      const department = employee.department || "General";
      const position = employee.position || "Employee";
      
      if (!departmentPositions[department]) {
        departmentPositions[department] = new Set();
      }
      
      departmentPositions[department].add(position);
    });

    // Convert to array format with unique positions per department
    const departments = Object.keys(departmentPositions).map(department => ({
      _id: department,
      department: department,
      positions: Array.from(departmentPositions[department]).map(position => ({
        _id: position,
        position: position,
        department: department
      }))
    })).sort((a, b) => a.department.localeCompare(b.department));

    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error) {
    console.error("GET /api/mail/departments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch departments",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
