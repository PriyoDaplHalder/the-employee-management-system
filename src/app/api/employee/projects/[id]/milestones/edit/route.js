import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/model/Project';
import ProjectAssignment from '@/model/ProjectAssignment';
import { User } from '@/model/User';
import { Permission } from '@/model/Permission';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error('No token provided');
  }
  return verifyToken(token);
};

// PUT - Update project milestones with permission check (employees with milestone editing permission)
export async function PUT(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { milestones, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(milestones)) {
      return NextResponse.json(
        { success: false, error: 'Milestones must be an array' },
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

    // Check if the employee has milestone editing permission for this project
    const permission = await Permission.findOne({
      employee: decoded.userId,
      isActive: true,
    });

    const hasProjectMilestone = permission && Array.isArray(permission.projectPermissions)
      ? permission.projectPermissions.some(
          (p) => p.projectId.toString() === id && p.canEditMilestone
        )
      : false;

    if (!hasProjectMilestone) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: You don't have permission to edit project milestones for this project",
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

    // Find and update the project
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update milestones
    project.milestones = milestones.map(milestone => ({
      ...milestone,
      updatedAt: new Date(),
      // Ensure createdAt exists for new milestones
      createdAt: milestone.createdAt || new Date()
    }));

    // Update notes if provided
    if (notes && Array.isArray(notes)) {
      project.notes = notes.map(note => ({
        ...note,
        updatedAt: new Date(),
        // Ensure createdAt exists for new notes
        createdAt: note.createdAt || new Date()
      }));
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Milestones and notes updated successfully by employee',
      milestones: project.milestones,
      notes: project.notes || []
    });

  } catch (error) {
    console.error('PUT /api/employee/projects/[id]/milestones/edit error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update milestones'
      },
      { status: error.message === 'No token provided' ? 401 : 500 }
    );
  }
}
