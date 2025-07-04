import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Download SRS document file
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

    // Check if SRS document file exists
    if (!project.srsDocument?.filePath) {
      return NextResponse.json(
        { error: "No SRS document file available for download" },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = path.join(process.cwd(), "public", project.srsDocument.filePath);
    
    // Check if file exists on disk
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "SRS document file not found on server" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const fileExtension = path.extname(project.srsDocument.fileName || "").toLowerCase();
    let contentType = "application/octet-stream";
    
    switch (fileExtension) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".doc":
        contentType = "application/msword";
        break;
      case ".docx":
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case ".txt":
        contentType = "text/plain";
        break;
      case ".md":
        contentType = "text/markdown";
        break;
    }

    // Create response with file
    const response = new NextResponse(fileBuffer);
    response.headers.set("Content-Type", contentType);
    response.headers.set("Content-Disposition", `attachment; filename="${project.srsDocument.fileName}"`);
    response.headers.set("Content-Length", fileBuffer.length.toString());

    return response;
  } catch (error) {
    console.error("Error downloading SRS document:", error);
    
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
