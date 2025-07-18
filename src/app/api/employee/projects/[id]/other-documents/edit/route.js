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

// POST - Upload other document with permission check (employees with other docs editing permission)
export async function POST(request, { params }) {
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

    // Check if the employee has other documents editing permission for this project
    const permission = await Permission.findOne({
      employee: user.userId,
      isActive: true,
    });

    const hasProjectOtherDocs =
      permission && Array.isArray(permission.projectPermissions)
        ? permission.projectPermissions.some(
            (p) => p.projectId.toString() === projectId && p.canEditOtherDocs
          )
        : false;

    if (!hasProjectOtherDocs) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied: You don't have permission to edit other documents for this project",
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

    // Parse form data
    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const file = formData.get("file");

    if (!file || !title) {
      return NextResponse.json(
        { success: false, error: "Title and file are required" },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "other-documents"
    );
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${projectId}_${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Add document to project
    const doc = {
      title,
      description,
      fileName: file.name,
      filePath: `/uploads/other-documents/${uniqueFileName}`,
      uploadedAt: new Date(),
      uploadedBy: user.userId,
      updatedAt: new Date(),
    };

    project.otherDocuments.push(doc);
    await project.save();

    return NextResponse.json(
      {
        success: true,
        document: doc,
        message:
          "Document uploaded successfully using your editing permissions!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/employee/projects/[id]/other-documents/edit error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload document",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// PUT - Update other document with permission check (employees with other docs editing permission)
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

    // Check if the employee has other documents editing permission for this project
    const permission = await Permission.findOne({
      employee: user.userId,
      isActive: true,
    });

    const hasProjectOtherDocs =
      permission && Array.isArray(permission.projectPermissions)
        ? permission.projectPermissions.some(
            (p) => p.projectId.toString() === projectId && p.canEditOtherDocs
          )
        : false;

    if (!hasProjectOtherDocs) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied: You don't have permission to edit other documents for this project",
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

    // Parse request body
    const body = await request.json();
    const { docId, title, description } = body;

    if (!docId || !title) {
      return NextResponse.json(
        { success: false, error: "Document ID and title are required" },
        { status: 400 }
      );
    }

    // Find and update the document
    const doc = project.otherDocuments.id(docId);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    doc.title = title;
    doc.description = description;
    doc.updatedAt = new Date();

    await project.save();

    return NextResponse.json({
      success: true,
      document: doc,
      message: "Document updated successfully using your editing permissions!",
    });
  } catch (error) {
    console.error(
      "PUT /api/employee/projects/[id]/other-documents/edit error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update document",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// DELETE - Delete other document with permission check (employees with other docs editing permission)
export async function DELETE(request, { params }) {
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

    // Check if the employee has other documents editing permission for this project
    const permission = await Permission.findOne({
      employee: user.userId,
      isActive: true,
    });

    const hasProjectOtherDocs =
      permission && Array.isArray(permission.projectPermissions)
        ? permission.projectPermissions.some(
            (p) => p.projectId.toString() === projectId && p.canEditOtherDocs
          )
        : false;

    if (!hasProjectOtherDocs) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied: You don't have permission to edit other documents for this project",
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

    // Get document ID from query parameters
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Find the document
    const doc = project.otherDocuments.id(docId);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete file from disk
    if (doc.filePath) {
      const absolutePath = path.join(process.cwd(), "public", doc.filePath);
      try {
        if (existsSync(absolutePath)) {
          await unlink(absolutePath);
        }
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Remove document from project
    project.otherDocuments.pull(docId);
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully using your editing permissions!",
    });
  } catch (error) {
    console.error(
      "DELETE /api/employee/projects/[id]/other-documents/edit error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete document",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
