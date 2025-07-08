import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Employee } from "@/model/Employee";
import { User } from "@/model/User";
import { Permission } from "@/model/Permission";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";

// PATCH - Update completed profile with permissions
export async function PATCH(request) {
  try {
    await dbConnect();

    const token = getTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (decoded.role !== "employee") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const {
      firstName,
      lastName,
      phone,
      address,
      emergencyContact,
      skills,
    } = await request.json();

    // Find existing employee profile
    let existingEmployee = await Employee.findOne({ user: decoded.userId }).populate("user");
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employee profile not found." },
        { status: 404 }
      );
    }

    // Only allow this endpoint for completed profiles
    if (!existingEmployee.profileCompleted) {
      return NextResponse.json(
        { error: "This endpoint is only for completed profiles. Use the regular update endpoint." },
        { status: 400 }
      );
    }

    // Get employee's active permissions
    const permission = await Permission.findOne({
      employee: decoded.userId,
      isActive: true,
    });

    if (!permission) {
      return NextResponse.json(
        {
          error: "No permissions granted. Contact management for edit access.",
        },
        { status: 403 }
      );
    }

    // Validate and prepare updates based on permissions
    const permittedUserUpdates = {};
    const permittedUpdates = {};

    // Check basic info permissions
    if (permission.canEditBasicInfo) {
      if (permission.basicInfoFields?.firstName && firstName?.trim()) {
        permittedUserUpdates.firstName = firstName.trim();
      }
      if (permission.basicInfoFields?.lastName && lastName?.trim()) {
        permittedUserUpdates.lastName = lastName.trim();
      }
    }

    // Check personal info permissions
    const personalInfoUpdate = {};
    if (permission.canEditPersonalInfo) {
      if (permission.personalInfoFields?.phone && phone?.trim()) {
        personalInfoUpdate.phone = phone.trim();
      }
      if (permission.personalInfoFields?.address && address?.trim()) {
        personalInfoUpdate.address = { street: address.trim() };
      }
      if (permission.personalInfoFields?.emergencyContact && emergencyContact?.trim()) {
        personalInfoUpdate.emergencyContact = { phone: emergencyContact.trim() };
      }
      if (permission.personalInfoFields?.skills && skills) {
        permittedUpdates.skills = Array.isArray(skills)
          ? skills.filter((skill) => skill.trim())
          : [];
      }
    }

    if (Object.keys(personalInfoUpdate).length > 0) {
      permittedUpdates.personalInfo = {
        ...existingEmployee.personalInfo,
        ...personalInfoUpdate,
      };
    }

    // Perform updates
    let hasUpdates = false;

    // Update user information if there are permitted changes
    if (Object.keys(permittedUserUpdates).length > 0) {
      await User.findByIdAndUpdate(existingEmployee.user._id, permittedUserUpdates);
      hasUpdates = true;
    }

    // Update employee information if there are permitted changes
    if (Object.keys(permittedUpdates).length > 0) {
      await Employee.findByIdAndUpdate(existingEmployee._id, permittedUpdates);
      hasUpdates = true;
    }

    // Fetch updated employee data
    const updatedEmployee = await Employee.findOne({ user: decoded.userId }).populate("user", "email firstName lastName");

    if (hasUpdates) {
      // Remove the permissions after successful update
      await Permission.findByIdAndDelete(permission._id);
      
      return NextResponse.json({
        message: "Profile updated successfully using granted permissions! Permissions have been revoked for security.",
        employee: updatedEmployee,
        permissionsRevoked: true,
      });
    } else {
      return NextResponse.json({
        message: "No changes made. Ensure you have the necessary permissions for the fields you're trying to update.",
        employee: updatedEmployee,
        permissionsRevoked: false,
      });
    }
  } catch (error) {
    console.error("Permitted profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
