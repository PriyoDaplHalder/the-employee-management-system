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

// GET - Fetch project milestones for assigned employees (read-only)
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      milestones: project.milestones || [],
      notes: project.notes || [],
      project: {
        id: project._id,
        name: project.name,
        details: project.details
      }
    });

  } catch (error) {
    console.error('GET /api/employee/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch milestones'
      },
      { status: error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

// PUT - Update milestone feature items completion status only (employee can only check/uncheck items assigned to them)
export async function PUT(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { milestoneId, featureId, itemId, completed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!milestoneId || !featureId || !itemId || completed === undefined) {
      return NextResponse.json(
        { success: false, error: 'milestoneId, featureId, itemId, and completed status are required' },
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.milestones) {
      return NextResponse.json(
        { success: false, error: 'No milestones found' },
        { status: 404 }
      );
    }

    // Find the milestone
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Find the feature
    const feature = milestone.features.find(f => f.id === featureId);
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Find the item
    const item = feature.items.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if the task is assigned to this employee or if no assignment is required
    if (item.assignedTo && String(item.assignedTo) !== String(decoded.userId)) {
      console.log('Access denied - Assignment mismatch:', {
        itemAssignedTo: item.assignedTo,
        itemAssignedToType: typeof item.assignedTo,
        itemAssignedToString: String(item.assignedTo),
        decodedUserId: decoded.userId,
        decodedUserIdType: typeof decoded.userId,
        decodedUserIdString: String(decoded.userId),
        areEqual: String(item.assignedTo) === String(decoded.userId),
        itemText: item.text
      });
      
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: You can only update tasks assigned to you",
        },
        { status: 403 }
      );
    }

    // Update only the completed status
    item.completed = completed;
    
    // Update the milestone's updatedAt timestamp
    milestone.updatedAt = new Date();

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Task item updated successfully',
      milestones: project.milestones
    });

  } catch (error) {
    console.error('PUT /api/employee/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update task item'
      },
      { status: error.message === 'No token provided' ? 401 : 500 }
    );
  }
}
