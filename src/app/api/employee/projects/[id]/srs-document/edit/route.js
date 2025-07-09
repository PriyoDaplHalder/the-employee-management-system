import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";
import ProjectAssignment from "@/model/ProjectAssignment";
import { User } from "@/model/User";
import { Permission } from "@/model/Permission";
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

// PUT - Update SRS document with permission check (employees with SRS editing permission)
export async function PUT(request, { params }) {
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

    // Check if the employee has SRS editing permission
    const permission = await Permission.findOne({
      employee: user.userId,
      isActive: true,
    });

    if (!permission || !permission.canEditProjectSRS) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: You don't have permission to edit SRS documents",
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
      const uploadDir = path.join(process.cwd(), "public", "uploads", "srs-documents");
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Delete old file if exists
      if (srsDocument.filePath) {
        const oldFilePath = path.join(process.cwd(), "public", srsDocument.filePath);
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

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { 
        $set: { 
          srsDocument: srsDocument
        }
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "SRS document updated successfully by employee",
      srsDocument: updatedProject.srsDocument,
    });
  } catch (error) {
    console.error("Error updating SRS document by employee:", error);
    
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
