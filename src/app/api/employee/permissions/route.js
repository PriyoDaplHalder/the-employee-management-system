import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Permission } from "@/model/Permission";
import { User } from "@/model/User";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// GET - Get permissions for the logged-in employee
export async function GET(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Check if user is an employee
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

    // Get the employee's active permissions
    const permission = await Permission.findOne({
      employee: decoded.userId,
      isActive: true,
    }).populate("grantedBy", "firstName lastName email");

    return NextResponse.json({
      success: true,
      permission: permission || null,
    });
  } catch (error) {
    console.error("GET /api/employee/permissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch permissions",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
