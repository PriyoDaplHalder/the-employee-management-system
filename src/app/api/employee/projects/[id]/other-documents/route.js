import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";
import ProjectAssignment from "@/model/ProjectAssignment";
import { User } from "@/model/User";
import { Permission } from "@/model/Permission";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Get other documents for a project (employees with view access)
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const projectId = params.id;

    // Connect to database
    await dbConnect();

    // Verify user is an employee
    const userDoc = await User.findById(user.userId);
    if (!userDoc || userDoc.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only employees can access this endpoint",
        },
        { status: 403 }
      );
    }

    // Check if the employee is assigned to this project
    const assignment = await ProjectAssignment.findOne({
      projectId: projectId,
      employeeId: user.userId,
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: You are not assigned to this project",
        },
        { status: 403 }
      );
    }

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: project.otherDocuments || [],
    });
  } catch (error) {
    console.error(
      "GET /api/employee/projects/[id]/other-documents error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch other documents",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
