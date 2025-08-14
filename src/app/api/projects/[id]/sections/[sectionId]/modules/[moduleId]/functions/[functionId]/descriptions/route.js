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

// GET - Fetch descriptions for a specific function
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const { id: projectId, sectionId, moduleId, functionId } = params;

    // Connect to database
    await dbConnect();

    // Find the project and specific section, module, and function
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const section = project.srsDocument?.sections?.find(s => s._id.toString() === sectionId);
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const module = section.modules?.find(m => m._id.toString() === moduleId);
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const functionItem = module.functions?.find(f => f._id.toString() === functionId);
    if (!functionItem) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      descriptions: functionItem.descriptions || [],
    });
  } catch (error) {
    console.error("Error fetching descriptions:", error);
    
    // Handle authentication errors
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update descriptions for a specific function
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const { id: projectId, sectionId, moduleId, functionId } = params;

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse request body
    const { descriptions } = await request.json();

    if (!Array.isArray(descriptions)) {
      return NextResponse.json({ error: "Descriptions must be an array" }, { status: 400 });
    }

    // Find the section, module, function and update its descriptions
    const sectionIndex = project.srsDocument?.sections?.findIndex(s => s._id.toString() === sectionId);
    if (sectionIndex === -1) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const moduleIndex = project.srsDocument.sections[sectionIndex].modules?.findIndex(m => m._id.toString() === moduleId);
    if (moduleIndex === -1) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const functionIndex = project.srsDocument.sections[sectionIndex].modules[moduleIndex].functions?.findIndex(f => f._id.toString() === functionId);
    if (functionIndex === -1) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    // Prepare descriptions data
    const descriptionData = descriptions.map(desc => ({
      content: desc.content.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Update the descriptions
    project.srsDocument.sections[sectionIndex].modules[moduleIndex].functions[functionIndex].descriptions = descriptionData;
    project.srsDocument.sections[sectionIndex].modules[moduleIndex].functions[functionIndex].updatedAt = new Date();

    // Save the project
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Descriptions updated successfully",
      descriptions: project.srsDocument.sections[sectionIndex].modules[moduleIndex].functions[functionIndex].descriptions,
    });
  } catch (error) {
    console.error("Error updating descriptions:", error);
    
    // Handle authentication errors
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
