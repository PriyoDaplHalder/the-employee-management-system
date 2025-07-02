import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/model/Project';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error('No token provided');
  }
  return verifyToken(token);
};

// GET - Fetch project milestones
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
      milestones: project.milestones || []
    });

  } catch (error) {
    console.error('GET /api/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch milestones'
      },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// PUT - Update project milestones
export async function PUT(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { milestones } = body;

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

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Milestones updated successfully',
      milestones: project.milestones
    });

  } catch (error) {
    console.error('PUT /api/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update milestones'
      },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// POST - Add a new milestone
export async function POST(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { milestone } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone data is required' },
        { status: 400 }
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

    // Add the new milestone
    const newMilestone = {
      ...milestone,
      id: milestone.id || `milestone_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!project.milestones) {
      project.milestones = [];
    }
    
    project.milestones.push(newMilestone);
    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Milestone added successfully',
      milestone: newMilestone,
      milestones: project.milestones
    });

  } catch (error) {
    console.error('POST /api/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add milestone'
      },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// DELETE - Delete a specific milestone
export async function DELETE(request, { params }) {
  try {
    // Verify token
    const decoded = getAuthenticatedUser(request);
    
    await dbConnect();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Milestone ID is required' },
        { status: 400 }
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

    // Remove the milestone
    if (project.milestones) {
      project.milestones = project.milestones.filter(m => m.id !== milestoneId);
      await project.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
      milestones: project.milestones || []
    });

  } catch (error) {
    console.error('DELETE /api/projects/[id]/milestones error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete milestone'
      },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}
