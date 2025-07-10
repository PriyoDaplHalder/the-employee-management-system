import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import { User } from "@/model/User";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// POST - Get project names by IDs
export async function POST(request) {
  try {
    // Verify token and ensure user is management
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();
    
    // Check if user is management
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "management") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only management can access project names",
        },
        { status: 403 }
      );
    }

    const { projectIds } = await request.json();

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project IDs provided",
        },
        { status: 400 }
      );
    }

    // Fetch projects with only _id and name fields
    const projects = await Project.find(
      { _id: { $in: projectIds } },
      { _id: 1, name: 1 }
    );

    return NextResponse.json({
      success: true,
      projects: projects,
    });

  } catch (error) {
    console.error("Error fetching project names:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch project names",
      },
      { status: 500 }
    );
  }
}
