import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/model/Project';
import ProjectAssignment from '@/model/ProjectAssignment';
import { User } from '@/model/User';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error('No token provided');
  }
  return verifyToken(token);
};

// GET - Fetch project SRS document for assigned employees (read-only)
export async function GET(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify user is an employee
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only employees can access this endpoint",
        },
        { status: 403 }
      );
    }

    // Check if the employee is assigned to this project
    const assignment = await ProjectAssignment.findOne({
      projectId: id,
      employeeId: decoded.userId,
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
    const project = await Project.findById(id).select('srsDocument');

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      srsDocument: project.srsDocument || null
    });

  } catch (error) {
    console.error('GET /api/employee/projects/[id]/srs-document error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch SRS document'
      },
      { status: error.message === 'No token provided' ? 401 : 500 }
    );
  }
}
