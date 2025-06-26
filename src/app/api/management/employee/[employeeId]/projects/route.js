import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProjectAssignment from "@/model/ProjectAssignment";
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

// GET - Get projects assigned to a specific employee (Management only)
export async function GET(request, { params }) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Verify user is management
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "management") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only management can view employee projects",
        },
        { status: 403 }
      );
    }

    const { employeeId } = params;

    // Verify the employee exists
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 }
      );
    }

    // Fetch assignments for this employee
    const assignments = await ProjectAssignment.find({
      employeeId,
    })
      .populate("projectId", "name details createdAt updatedAt isActive")
      .populate("assignedBy", "firstName lastName email")
      .sort({ assignedDate: -1 });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("GET /api/management/employee/[employeeId]/projects error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch employee projects",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
