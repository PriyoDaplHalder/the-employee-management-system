import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) throw new Error("No token provided");
  return verifyToken(token);
};

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, documents: project.otherDocuments || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = getAuthenticatedUser(request);
    await dbConnect();
    const { id } = params;
    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const file = formData.get("file");
    if (!file || !title) {
      return NextResponse.json({ success: false, error: "Title and file are required" }, { status: 400 });
    }
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "other-documents");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${id}_${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    // Update project
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
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
    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const { docId, title, description } = body;
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    const doc = project.otherDocuments.id(docId);
    if (!doc) return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    doc.title = title;
    doc.description = description;
    doc.updatedAt = new Date();
    await project.save();
    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    const doc = project.otherDocuments.id(docId);
    if (!doc) return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    // Delete file from disk
    if (doc.filePath) {
      const absPath = path.join(process.cwd(), "public", doc.filePath);
      try {
        if (existsSync(absPath)) {
          await unlink(absPath);
        }
      } catch (e) {
        // ignore
      }
    }
    doc.remove();
    await project.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
