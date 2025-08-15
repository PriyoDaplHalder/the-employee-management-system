import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Fetch modules for a specific section
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const { id: projectId, sectionId } = params;

    // Connect to database
    await dbConnect();

    // Find the project and specific section
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const section = project.srsDocument?.sections?.find(
      (s) => s._id.toString() === sectionId
    );
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      modules: section.modules || [],
    });
  } catch (error) {
    console.error("Error fetching modules:", error);

    // Handle authentication errors
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update modules for a specific section
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const { id: projectId, sectionId } = params;

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse request body
    const { modules } = await request.json();

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Modules must be an array" },
        { status: 400 }
      );
    }

    // Find the section and update its modules
    const sectionIndex = project.srsDocument?.sections?.findIndex(
      (s) => s._id.toString() === sectionId
    );
    if (sectionIndex === -1) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Get existing modules to preserve their functions
    const existingModules =
      project.srsDocument.sections[sectionIndex].modules || [];

    // Merge new modules with existing ones, preserving existing data
    const moduleData = modules.map((newModule, index) => {
      const existingModule = existingModules[index];

      if (existingModule) {
        // Update existing module, preserve functions
        return {
          ...existingModule,
          title: newModule.title.trim(),
          updatedAt: new Date(),
        };
      } else {
        // Create new module
        return {
          title: newModule.title.trim(),
          functions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    // Update the modules
    project.srsDocument.sections[sectionIndex].modules = moduleData;
    project.srsDocument.sections[sectionIndex].updatedAt = new Date();

    // Save the project
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Modules updated successfully",
      modules: project.srsDocument.sections[sectionIndex].modules,
    });
  } catch (error) {
    console.error("Error updating modules:", error);

    // Handle authentication errors
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
