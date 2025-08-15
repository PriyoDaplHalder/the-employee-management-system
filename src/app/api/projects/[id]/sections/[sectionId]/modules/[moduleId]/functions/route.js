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

// GET - Fetch functions for a specific module
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const { id: projectId, sectionId, moduleId } = params;

    // Connect to database
    await dbConnect();

    // Find the project and specific section and module
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

    const module = section.modules?.find((m) => m._id.toString() === moduleId);
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      functions: module.functions || [],
    });
  } catch (error) {
    console.error("Error fetching functions:", error);

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

// PUT - Update functions for a specific module
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const { id: projectId, sectionId, moduleId } = params;

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse request body
    const { functions } = await request.json();

    if (!Array.isArray(functions)) {
      return NextResponse.json(
        { error: "Functions must be an array" },
        { status: 400 }
      );
    }

    // Find the section, module and update its functions
    const sectionIndex = project.srsDocument?.sections?.findIndex(
      (s) => s._id.toString() === sectionId
    );
    if (sectionIndex === -1) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const moduleIndex = project.srsDocument.sections[
      sectionIndex
    ].modules?.findIndex((m) => m._id.toString() === moduleId);
    if (moduleIndex === -1) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get existing functions to preserve their descriptions
    const existingFunctions =
      project.srsDocument.sections[sectionIndex].modules[moduleIndex]
        .functions || [];

    // Merge new functions with existing ones, preserving existing data
    const functionData = functions.map((newFunction, index) => {
      const existingFunction = existingFunctions[index];

      if (existingFunction) {
        // Update existing function, preserve descriptions
        return {
          ...existingFunction,
          title: newFunction.title.trim(),
          updatedAt: new Date(),
        };
      } else {
        // Create new function
        return {
          title: newFunction.title.trim(),
          descriptions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    // Update the functions
    project.srsDocument.sections[sectionIndex].modules[moduleIndex].functions =
      functionData;
    project.srsDocument.sections[sectionIndex].modules[moduleIndex].updatedAt =
      new Date();

    // Save the project
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Functions updated successfully",
      functions:
        project.srsDocument.sections[sectionIndex].modules[moduleIndex]
          .functions,
    });
  } catch (error) {
    console.error("Error updating functions:", error);

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
