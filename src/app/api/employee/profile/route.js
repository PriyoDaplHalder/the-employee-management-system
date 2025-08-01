import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Employee } from "@/model/Employee";
import { User } from "@/model/User";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import { synchronizeEmployeeName, synchronizeEmployeePosition, fullEmployeeDataSync } from "@/lib/dataSynchronization";

// GET FUNCTION: Fetch Employee Profile
export async function GET(request) {
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

    const employee = await Employee.findOne({ user: decoded.userId }).populate(
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
    console.error("Employee profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST FUNCTION: Create Employee Profile
export async function POST(request) {
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

    // Check if employee profile already exists
    let existingEmployee = await Employee.findOne({ user: decoded.userId });
    if (existingEmployee) {
      // If profile is already completed, prevent any changes
      if (existingEmployee.profileCompleted) {
        return NextResponse.json(
          {
            error:
              "Profile already completed. You cannot make changes once your profile is completed. Contact management for any updates.",
          },
          { status: 400 }
        );
      }
      
      // If profile exists but has only default values (created during signup), allow updating it
      // Check if this is a default profile (created during signup with default values)
      const isDefaultProfile = existingEmployee.department === 'General' && 
                             existingEmployee.position === 'Employee' && 
                             existingEmployee.salary === 0 && 
                             !existingEmployee.hireDate;
      
      if (!isDefaultProfile) {
        // If profile exists but not completed and not default, redirect to PATCH
        return NextResponse.json(
          {
            error:
              "Profile already exists but not completed. Please use the update profile functionality to fill empty fields.",
            suggestion: "Use PATCH method to update your incomplete profile"
          },
          { status: 400 }
        );
      }
      
      // If it's a default profile, allow updating it in POST method
      // This makes it more user-friendly for new employees
    }

    const {
      firstName,
      lastName,
      employeeId,
      department,
      position,
      salary,
      hireDate,
      phone,
      address,
      emergencyContact,
      skills,
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !department || !position || !hireDate) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    // Update user with name information
    await User.findByIdAndUpdate(decoded.userId, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    let employee;
    
    if (existingEmployee) {
      // Update existing incomplete profile
      const updateData = {
        department: department.trim(),
        position: position.trim(),
        salary: salary ? parseFloat(salary) : undefined,
        hireDate: new Date(hireDate),
        skills: Array.isArray(skills)
          ? skills.filter((skill) => skill.trim())
          : [],
        personalInfo: {
          phone: phone?.trim() || "",
          address: {
            street: address?.trim() || "",
          },
          emergencyContact: {
            phone: emergencyContact?.trim() || "",
          },
        },
        profileCompleted: true,
        profileCompletedAt: new Date(),
      };

      // Update the existing employee record
      employee = await Employee.findByIdAndUpdate(
        existingEmployee._id,
        updateData,
        { new: true }
      ).populate("user", "email firstName lastName");

    } else {
      // Generate employee ID if not provided
      const finalEmployeeId = employeeId || `DAPL-${Date.now()}`;

      // Create new employee profile
      employee = new Employee({
        user: decoded.userId,
        employeeId: finalEmployeeId,
        department: department.trim(),
        position: position.trim(),
        salary: salary ? parseFloat(salary) : undefined,
        hireDate: new Date(hireDate),
        skills: Array.isArray(skills)
          ? skills.filter((skill) => skill.trim())
          : [],
        personalInfo: {
          phone: phone?.trim() || "",
          address: {
            street: address?.trim() || "",
          },
          emergencyContact: {
            phone: emergencyContact?.trim() || "",
          },
        },
        profileCompleted: true,
        profileCompletedAt: new Date(),
      });

      await employee.save();

      employee = await Employee.findById(employee._id).populate(
        "user",
        "email firstName lastName"
      );
    }

    return NextResponse.json({
      message: "Employee profile created successfully!",
      employee: employee,
    });
  } catch (error) {
    console.error("Employee profile creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT FUNCTION: Update Employee Profile (Management Only)
export async function PUT(request) {
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

    // Only management can update employee profiles
    if (decoded.role !== "management") {
      return NextResponse.json(
        {
          error: "Access denied. Only management can update employee details.",
        },
        { status: 403 }
      );
    }

    const {
      employeeId,
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
    } = await request.json();

    // Find employee by employeeId
    let employee;
    if (employeeId) {
      employee = await Employee.findOne({ employeeId }).populate("user");
    } else {
      return NextResponse.json(
        { error: "Employee ID is required for updates" },
        { status: 400 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Update user information
    await User.findByIdAndUpdate(employee.user._id, {
      firstName,
      lastName,
    });

    // Update employee information
    const updateData = {
      department,
      position,
      salary: parseFloat(salary),
      hireDate: new Date(hireDate),
      skills: Array.isArray(skills) ? skills : [],
      personalInfo: {
        phone,
        address: {
          street: address,
        },
        emergencyContact: {
          phone: emergencyContact,
        },
      },
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      updateData,
      { new: true }
    ).populate("user", "email firstName lastName");

    return NextResponse.json({
      message: "Employee profile updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Employee profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH FUNCTION: Update Employee Profile (Only empty fields, Employee Only)
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
      employeeId,
      department,
      position,
      salary,
      hireDate,
      phone,
      address,
      emergencyContact,
      skills,
      completeProfile,
    } = await request.json();

    // Find existing employee profile
    let existingEmployee = await Employee.findOne({ user: decoded.userId }).populate("user");
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employee profile not found. Please create your profile first." },
        { status: 404 }
      );
    }

    // If profile is already completed, check for permissions
    if (existingEmployee.profileCompleted) {
      // Import Permission model to check permissions
      const { Permission } = require("@/model/Permission");
      
      // Get employee's active permissions
      const permission = await Permission.findOne({
        employee: decoded.userId,
        isActive: true,
      });

      if (!permission) {
        return NextResponse.json(
          {
            error:
              "Profile already completed. You cannot make changes once your profile is completed. Contact management for any updates.",
          },
          { status: 400 }
        );
      }

      // If permissions exist, validate that only permitted fields are being updated
      const permittedUpdates = {};
      const permittedUserUpdates = {};

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

      // Update user information if there are permitted changes
      if (Object.keys(permittedUserUpdates).length > 0) {
        await User.findByIdAndUpdate(existingEmployee.user._id, permittedUserUpdates);
        
        // Trigger synchronization if name changed
        if (permittedUserUpdates.firstName || permittedUserUpdates.lastName) {
          try {
            await synchronizeEmployeeName(
              existingEmployee.user._id.toString(),
              permittedUserUpdates.firstName || existingEmployee.user.firstName,
              permittedUserUpdates.lastName || existingEmployee.user.lastName
            );
          } catch (syncError) {
            console.error('Error synchronizing employee name:', syncError);
          }
        }
      }

      // Update employee information if there are permitted changes
      if (Object.keys(permittedUpdates).length > 0) {
        const updatedEmployee = await Employee.findByIdAndUpdate(
          existingEmployee._id,
          permittedUpdates,
          { new: true }
        ).populate("user", "email firstName lastName");

        // Trigger synchronization if position changed
        if (permittedUpdates.position) {
          try {
            await synchronizeEmployeePosition(
              existingEmployee.user._id.toString(),
              existingEmployee.position,
              permittedUpdates.position
            );
          } catch (syncError) {
            console.error('Error synchronizing employee position:', syncError);
          }
        }

        // Revoke the permission after successful update
        await Permission.findByIdAndDelete(permission._id);

        return NextResponse.json({
          message: "Profile updated successfully using granted permissions! Permissions have been revoked for security.",
          employee: updatedEmployee,
          permissionsRevoked: true,
        });
      } else {
        return NextResponse.json({
          message: "No permitted changes were made. Check your permissions with management.",
          employee: existingEmployee,
          permissionsRevoked: false,
        });
      }
    }

    // Prepare update data - only update empty/null fields
    const updateData = {};
    const userUpdateData = {};

    // Update user fields only if they are currently empty or undefined
    if ((!existingEmployee.user.firstName || existingEmployee.user.firstName.trim() === '') && firstName?.trim()) {
      userUpdateData.firstName = firstName.trim();
    }
    if ((!existingEmployee.user.lastName || existingEmployee.user.lastName.trim() === '') && lastName?.trim()) {
      userUpdateData.lastName = lastName.trim();
    }

    // Update employee fields only if they are currently empty, undefined, or have default values
    if ((!existingEmployee.department || existingEmployee.department.trim() === '' || existingEmployee.department === 'General') && department?.trim()) {
      updateData.department = department.trim();
    }
    if ((!existingEmployee.position || existingEmployee.position.trim() === '' || existingEmployee.position === 'Employee') && position?.trim()) {
      updateData.position = position.trim();
    }
    if ((!existingEmployee.salary || existingEmployee.salary === 0) && salary) {
      updateData.salary = parseFloat(salary);
    }
    if (!existingEmployee.hireDate && hireDate) {
      updateData.hireDate = new Date(hireDate);
    }
    if ((!existingEmployee.skills || existingEmployee.skills.length === 0) && skills) {
      updateData.skills = Array.isArray(skills)
        ? skills.filter((skill) => skill.trim())
        : [];
    }

    // Update personal info only if fields are empty or undefined
    const personalInfoUpdate = {};
    if ((!existingEmployee.personalInfo?.phone || existingEmployee.personalInfo.phone.trim() === '') && phone?.trim()) {
      personalInfoUpdate.phone = phone.trim();
    }
    if ((!existingEmployee.personalInfo?.address?.street || existingEmployee.personalInfo.address.street.trim() === '') && address?.trim()) {
      personalInfoUpdate.address = { street: address.trim() };
    }
    if ((!existingEmployee.personalInfo?.emergencyContact?.phone || existingEmployee.personalInfo.emergencyContact.phone.trim() === '') && emergencyContact?.trim()) {
      personalInfoUpdate.emergencyContact = { phone: emergencyContact.trim() };
    }

    if (Object.keys(personalInfoUpdate).length > 0) {
      updateData.personalInfo = {
        ...existingEmployee.personalInfo,
        ...personalInfoUpdate,
      };
    }

    // If completeProfile is true, mark profile as completed
    if (completeProfile) {
      updateData.profileCompleted = true;
      updateData.profileCompletedAt = new Date();
    }

    // Update user information if there are changes
    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(existingEmployee.user._id, userUpdateData);
      
      // Trigger synchronization if name changed
      if (userUpdateData.firstName || userUpdateData.lastName) {
        try {
          await synchronizeEmployeeName(
            existingEmployee.user._id.toString(),
            userUpdateData.firstName || existingEmployee.user.firstName,
            userUpdateData.lastName || existingEmployee.user.lastName
          );
        } catch (syncError) {
          console.error('Error synchronizing employee name:', syncError);
        }
      }
    }

    // Update employee information if there are changes
    if (Object.keys(updateData).length > 0) {
      const updatedEmployee = await Employee.findByIdAndUpdate(
        existingEmployee._id,
        updateData,
        { new: true }
      ).populate("user", "email firstName lastName");

      // Trigger synchronization if position changed
      if (updateData.position) {
        try {
          await synchronizeEmployeePosition(
            existingEmployee.user._id.toString(),
            existingEmployee.position,
            updateData.position
          );
        } catch (syncError) {
          console.error('Error synchronizing employee position:', syncError);
        }
      }

      return NextResponse.json({
        message: completeProfile 
          ? "Profile completed successfully! You can no longer edit your profile."
          : "Profile updated successfully!",
        employee: updatedEmployee,
      });
    } else {
      return NextResponse.json({
        message: "No changes made. You can only fill empty fields.",
        employee: existingEmployee,
      });
    }
  } catch (error) {
    console.error("Employee profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
