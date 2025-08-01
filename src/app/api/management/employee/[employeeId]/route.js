import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Employee } from "@/model/Employee";
import { User } from "@/model/User";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import { synchronizeEmployeeName, synchronizeEmployeePosition, fullEmployeeDataSync } from "@/lib/dataSynchronization";

// GET FUNCTION: Fetch Specific Employee Profile (Management Only)
export async function GET(request, { params }) {
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
    if (decoded.role !== "management") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { employeeId } = params;

    const employee = await Employee.findOne({ employeeId }).populate(
      "user",
      "email firstName lastName"
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Employee profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Management employee profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT FUNCTION: Update Specific Employee Profile (Management Only)
export async function PUT(request, { params }) {
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
    if (decoded.role !== "management") {
      return NextResponse.json(
        {
          error: "Access denied. Only management can update employee details.",
        },
        { status: 403 }
      );
    }
    const { employeeId } = params;
    const {
      firstName,
      lastName,
      department,
      position,
      salary,
      hireDate,
      phone,
      address,
      emergencyContact,
      skills,
      isActive,
    } = await request.json();

    // Validate required fields
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !department?.trim() ||
      !position?.trim() ||
      !hireDate
    ) {
      return NextResponse.json(
        {
          error:
            "First name, last name, department, position, and hire date are required",
        },
        { status: 400 }
      );
    }

    // Find employee by employeeId
    const employee = await Employee.findOne({ employeeId }).populate("user");

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }    // Update user information
    const oldUserData = { ...employee.user.toObject() };
    await User.findByIdAndUpdate(employee.user._id, {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      isActive: isActive !== undefined ? isActive : employee.user.isActive,
    });

    // Update employee information
    const oldEmployeeData = { ...employee.toObject() };
    const updateData = {
      department: department?.trim(),
      position: position?.trim(),
      salary: salary ? parseFloat(salary) : employee.salary,
      hireDate: hireDate ? new Date(hireDate) : employee.hireDate,
      skills: Array.isArray(skills)
        ? skills.filter((skill) => skill.trim())
        : employee.skills,
      personalInfo: {
        phone: phone?.trim() || employee.personalInfo?.phone || "",
        address: {
          street:
            address?.trim() || employee.personalInfo?.address?.street || "",
        },
        emergencyContact: {
          phone:
            emergencyContact?.trim() ||
            employee.personalInfo?.emergencyContact?.phone ||
            "",
        },
      },
      isActive: isActive !== undefined ? isActive : employee.isActive,
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      updateData,
      { new: true }
    ).populate("user", "email firstName lastName isActive");

    // Perform data synchronization if name or position changed
    try {
      const nameChanged = 
        oldUserData.firstName !== firstName?.trim() || 
        oldUserData.lastName !== lastName?.trim();
      
      const positionChanged = oldEmployeeData.position !== position?.trim();

      if (nameChanged || positionChanged) {
        console.log('Employee data changed, triggering synchronization...');
        
        if (nameChanged) {
          await synchronizeEmployeeName(
            employee.user._id.toString(), 
            firstName?.trim(), 
            lastName?.trim()
          );
        }
        
        if (positionChanged) {
          await synchronizeEmployeePosition(
            employee.user._id.toString(),
            oldEmployeeData.position,
            position?.trim()
          );
        }
        
        // Also perform a full sync to ensure everything is consistent
        await fullEmployeeDataSync(employee.user._id.toString());
        
        console.log('Data synchronization completed successfully');
      }
    } catch (syncError) {
      console.error('Error during data synchronization:', syncError);
      // Log the error but don't fail the update operation
    }

    return NextResponse.json({
      message: "Employee profile updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Management employee profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
