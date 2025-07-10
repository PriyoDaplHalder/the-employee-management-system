import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import { User } from "@/model/User";
import { 
  fullEmployeeDataSync, 
  batchSynchronizeEmployees, 
  cleanupOrphanedMappings 
} from "@/lib/dataSynchronization";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// POST - Trigger data synchronization (Management only)
export async function POST(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Check if user is management
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "management") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only management can trigger data synchronization",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userIds } = body;

    let result;

    switch (action) {
      case "sync_single":
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "User IDs are required for single synchronization",
            },
            { status: 400 }
          );
        }
        
        if (userIds.length === 1) {
          result = await fullEmployeeDataSync(userIds[0]);
        } else {
          result = await batchSynchronizeEmployees(userIds);
        }
        break;

      case "sync_all":
        // Get all employee user IDs
        const { Employee } = require("@/model/Employee");
        const employees = await Employee.find({ isActive: true }).select('user');
        const allUserIds = employees.map(emp => emp.user.toString());
        
        result = await batchSynchronizeEmployees(allUserIds);
        break;

      case "cleanup_orphaned":
        result = await cleanupOrphanedMappings();
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Supported actions: sync_single, sync_all, cleanup_orphaned",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Data synchronization completed successfully`,
    });
  } catch (error) {
    console.error("POST /api/management/sync-data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to synchronize data",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// GET - Get synchronization status and statistics (Management only)
export async function GET(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Check if user is management
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "management") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only management can view synchronization status",
        },
        { status: 403 }
      );
    }

    const { Employee } = require("@/model/Employee");
    const { PositionEmailMapping } = require("@/model/PositionEmailMapping");

    // Get statistics
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const totalPositionMappings = await PositionEmailMapping.countDocuments({ isActive: true });
    
    // Get employees without proper names
    const employeesWithoutNames = await Employee.find({ isActive: true })
      .populate('user', 'firstName lastName email')
      .then(employees => 
        employees.filter(emp => 
          !emp.user?.firstName || 
          !emp.user?.lastName || 
          emp.user.firstName.trim() === '' || 
          emp.user.lastName.trim() === ''
        )
      );

    // Get position mappings that might be outdated
    const positionMappings = await PositionEmailMapping.find({ isActive: true });
    const potentiallyOutdated = [];

    for (const mapping of positionMappings) {
      const user = await User.findOne({ email: mapping.email });
      if (user) {
        const employee = await Employee.findOne({ user: user._id });
        if (employee) {
          const expectedName = `${user.firstName} ${user.lastName}`.trim();
          if (mapping.employeeName !== expectedName || mapping.position !== employee.position) {
            potentiallyOutdated.push({
              mappingId: mapping._id,
              email: mapping.email,
              currentName: mapping.employeeName,
              expectedName,
              currentPosition: mapping.position,
              expectedPosition: employee.position
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      statistics: {
        totalEmployees,
        totalPositionMappings,
        employeesWithoutProperNames: employeesWithoutNames.length,
        potentiallyOutdatedMappings: potentiallyOutdated.length
      },
      employeesWithoutNames: employeesWithoutNames.map(emp => ({
        _id: emp._id,
        employeeId: emp.employeeId,
        email: emp.user?.email,
        firstName: emp.user?.firstName || '',
        lastName: emp.user?.lastName || ''
      })),
      potentiallyOutdatedMappings: potentiallyOutdated
    });
  } catch (error) {
    console.error("GET /api/management/sync-data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get synchronization status",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
