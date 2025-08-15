import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Fetch SRS document information
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const projectId = params.id;

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      srsDocument: project.srsDocument || {
        websiteLink: "",
        fileName: "",
        filePath: "",
        uploadedAt: null,
        uploadedBy: null,
        updatedAt: null,
      },
    });
  } catch (error) {
    console.error("Error fetching SRS document:", error);

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

// PUT - Update SRS document (management only)
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const projectId = params.id;

    // Check if user has access (management only)
    if (user.role !== "management") {
      return NextResponse.json(
        { error: "Access denied. Management role required." },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const websiteLink = formData.get("websiteLink") || "";
    const srsFile = formData.get("srsFile");

    let srsDocument = project.srsDocument || {};

    // Update website link
    srsDocument.websiteLink = websiteLink.trim();
    srsDocument.updatedAt = new Date();

    // Handle file upload if provided
    if (srsFile && srsFile.size > 0) {
      // Validate file size (10MB limit)
      if (srsFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size should not exceed 10MB" },
          { status: 400 }
        );
      }

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "srs-documents"
      );
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Delete old file if exists
      if (srsDocument.filePath) {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          srsDocument.filePath
        );
        try {
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath);
          }
        } catch (unlinkError) {
          console.error("Error deleting old file:", unlinkError);
        }
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = srsFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFileName = `${projectId}_${timestamp}_${sanitizedFileName}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      // Save the file
      const bytes = await srsFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Update document info
      srsDocument.fileName = srsFile.name;
      srsDocument.filePath = `/uploads/srs-documents/${uniqueFileName}`;
      srsDocument.uploadedAt = new Date();
      srsDocument.uploadedBy = user.userId;
    }

    // Handle SRS sections update
    const sectionsRaw = formData.get("sections");
    if (sectionsRaw) {
      try {
        const newSections = JSON.parse(sectionsRaw);
        if (Array.isArray(newSections)) {
          const existingSections = srsDocument.sections || [];

          // Merge new sections with existing ones, preserving existing data
          srsDocument.sections = newSections.map((newSection, index) => {
            const existingSection = existingSections[index];

            if (existingSection) {
              // Update existing section, preserve modules/functions/descriptions
              return {
                ...existingSection,
                title: newSection.title,
                updatedAt: new Date(),
              };
            } else {
              // Create new section
              return {
                title: newSection.title,
                modules: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
          });
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid sections data" },
          { status: 400 }
        );
      }
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          srsDocument: srsDocument,
        },
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "SRS document updated successfully",
      srsDocument: updatedProject.srsDocument,
    });
  } catch (error) {
    console.error("Error updating SRS document:", error);

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

// DELETE - Delete SRS document file (management only)
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const projectId = params.id;

    // Check if user has access (management only)
    if (user.role !== "management") {
      return NextResponse.json(
        { error: "Access denied. Management role required." },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let srsDocument = project.srsDocument || {};

    // Delete file if exists
    if (srsDocument.filePath) {
      const filePath = path.join(process.cwd(), "public", srsDocument.filePath);
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }

      // Clear file-related fields
      srsDocument.fileName = "";
      srsDocument.filePath = "";
      srsDocument.uploadedAt = null;
      srsDocument.uploadedBy = null;
      srsDocument.updatedAt = new Date();

      // Update the project
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        {
          $set: {
            srsDocument: srsDocument,
          },
        },
        { new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        message: "SRS document file deleted successfully",
        srsDocument: updatedProject.srsDocument,
      });
    } else {
      return NextResponse.json({ error: "No file to delete" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error deleting SRS document:", error);

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
