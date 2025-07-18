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

// GET - Get all employees assigned to a specific project (for employees who have access to that project)
export async function GET(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Verify user is an employee
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only employees can access this endpoint",
        },
        { status: 403 }
      );
    }

    const projectId = params.id;

    // Check if the employee has access to this project
    const userAssignment = await ProjectAssignment.findOne({
      employeeId: decoded.userId,
      projectId: projectId,
    });

    if (!userAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You don't have access to this project",
        },
        { status: 403 }
      );
    }

    // Fetch all assignments for this project
    const assignments = await ProjectAssignment.find({
      projectId: projectId,
    })
      .populate("employeeId", "firstName lastName email")
      .populate("assignedBy", "firstName lastName email")
      .sort({ assignedDate: -1 });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("GET /api/employee/projects/[id]/assignments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch project assignments",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
