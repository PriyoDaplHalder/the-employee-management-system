import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/model/Task";
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

// GET - Get tasks assigned to a specific employee (Management only)
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
          error: "Unauthorized: Only management can view employee tasks",
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

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");

    // Build filter query
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (projectId) filters.projectId = projectId;

    // Use the static method to get tasks
    const tasks = await Task.getTasksByEmployee(employeeId, filters);

    // Get task statistics
    const allTasks = await Task.find({ 
      assignedTo: employeeId, 
      isActive: true 
    });

    const stats = {
      total: allTasks.length,
      assigned: allTasks.filter(t => t.status === "Assigned").length,
      inProgress: allTasks.filter(t => t.status === "In Progress").length,
      onHold: allTasks.filter(t => t.status === "On Hold").length,
      underReview: allTasks.filter(t => t.status === "Under Review").length,
      completed: allTasks.filter(t => t.status === "Completed").length,
      overdue: allTasks.filter(t => t.dueDate < new Date() && t.status !== "Completed").length,
    };

    return NextResponse.json({
      success: true,
      tasks,
      stats,
    });
  } catch (error) {
    console.error("GET /api/management/employee/[employeeId]/tasks error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch employee tasks",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
