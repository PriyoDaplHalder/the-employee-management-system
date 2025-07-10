import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import ProjectAssignment from "@/model/ProjectAssignment";
import Project from "@/model/Project";

export async function GET(request) {
  try {
    // Verify token and get user info
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authentication token is required" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyToken(token);
    if (!decodedToken || decodedToken.role !== "management") {
      return NextResponse.json(
        { error: "Only management can access this endpoint" },
        { status: 403 }
      );
    }

    // Get employee ID from query params
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find projects assigned to the employee
    const assignments = await ProjectAssignment.find({ employeeId }).lean();
    const projectIds = assignments.map(assignment => assignment.projectId);

    // Get full project details
    const projects = await Project.find({ _id: { $in: projectIds } }).lean();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching employee projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee projects", details: error.message },
      { status: 500 }
    );
  }
}
