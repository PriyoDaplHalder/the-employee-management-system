import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Permission } from "@/model/Permission";
import { User } from "@/model/User";
import { Employee } from "@/model/Employee";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Get all employee permissions (Management only)
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
          error: "Unauthorized: Only management can view permissions",
        },
        { status: 403 }
      );
    }

    // Get all employees with their permissions
    const employees = await Employee.find({ isActive: true })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    const employeesWithPermissions = await Promise.all(
      employees.map(async (employee) => {
        const permission = await Permission.findOne({
          employee: employee.user._id,
          isActive: true,
        }).populate("grantedBy", "firstName lastName email");

        return {
          _id: employee.user._id,
          employeeId: employee.employeeId,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
          email: employee.user.email,
          permission: permission || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      employees: employeesWithPermissions,
    });
  } catch (error) {
    console.error("GET /api/management/permissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch permissions",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// POST - Grant or update permissions for an employee (Management only)
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
          error: "Unauthorized: Only management can grant permissions",
        },
        { status: 403 }
      );
    }

    const {
      employeeId,
      canEditBasicInfo,
      basicInfoFields,
      canEditPersonalInfo,
      personalInfoFields,
      reason,
    } = await request.json();

    // Validate required fields
    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee ID is required",
        },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 }
      );
    }

    // Revoke any existing active permission for this employee
    await Permission.updateMany(
      { employee: employeeId, isActive: true },
      { 
        isActive: false, 
        revokedAt: new Date() 
      }
    );

    // Create new permission
    const permission = new Permission({
      employee: employeeId,
      canEditBasicInfo: canEditBasicInfo || false,
      basicInfoFields: {
        firstName: basicInfoFields?.firstName || false,
        lastName: basicInfoFields?.lastName || false,
      },
      canEditPersonalInfo: canEditPersonalInfo || false,
      personalInfoFields: {
        phone: personalInfoFields?.phone || false,
        address: personalInfoFields?.address || false,
        emergencyContact: personalInfoFields?.emergencyContact || false,
      },
      grantedBy: decoded.userId,
      reason: reason?.trim() || "",
    });

    await permission.save();

    // Populate the response
    await permission.populate([
      { path: "employee", select: "firstName lastName email" },
      { path: "grantedBy", select: "firstName lastName email" },
    ]);

    return NextResponse.json({
      success: true,
      message: "Permissions granted successfully",
      permission,
    });
  } catch (error) {
    console.error("POST /api/management/permissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to grant permissions",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// PUT - Update existing permissions (Management only)
export async function PUT(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Check if user is management
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "management") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only management can update permissions",
        },
        { status: 403 }
      );
    }

    const {
      permissionId,
      canEditBasicInfo,
      basicInfoFields,
      canEditPersonalInfo,
      personalInfoFields,
      reason,
    } = await request.json();

    if (!permissionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission ID is required",
        },
        { status: 400 }
      );
    }

    // Find and update the permission
    const permission = await Permission.findById(permissionId);
    if (!permission || !permission.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission not found",
        },
        { status: 404 }
      );
    }

    // Update the permission
    permission.canEditBasicInfo = canEditBasicInfo || false;
    permission.basicInfoFields = {
      firstName: basicInfoFields?.firstName || false,
      lastName: basicInfoFields?.lastName || false,
    };
    permission.canEditPersonalInfo = canEditPersonalInfo || false;
    permission.personalInfoFields = {
      phone: personalInfoFields?.phone || false,
      address: personalInfoFields?.address || false,
      emergencyContact: personalInfoFields?.emergencyContact || false,
    };
    permission.reason = reason?.trim() || permission.reason;

    await permission.save();

    // Populate the response
    await permission.populate([
      { path: "employee", select: "firstName lastName email" },
      { path: "grantedBy", select: "firstName lastName email" },
    ]);

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
      permission,
    });
  } catch (error) {
    console.error("PUT /api/management/permissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update permissions",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// DELETE - Revoke permissions for an employee (Management only)
export async function DELETE(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Check if user is management
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "management") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only management can revoke permissions",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");
    const employeeId = searchParams.get("employeeId");

    if (permissionId) {
      // Revoke specific permission by ID
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        return NextResponse.json(
          {
            success: false,
            error: "Permission not found",
          },
          { status: 404 }
        );
      }

      permission.isActive = false;
      permission.revokedAt = new Date();
      await permission.save();
    } else if (employeeId) {
      // Revoke all active permissions for employee
      await Permission.updateMany(
        { employee: employeeId, isActive: true },
        { 
          isActive: false, 
          revokedAt: new Date() 
        }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Permission ID or Employee ID is required",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Permissions revoked successfully",
    });
  } catch (error) {
    console.error("DELETE /api/management/permissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to revoke permissions",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
