import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Mail } from "@/model/Mail";
import { Employee } from "@/model/Employee";
import { User } from "@/model/User";
import { PositionEmailMapping } from "@/model/PositionEmailMapping";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import { sendEmail, generateEmailTemplate } from "@/lib/emailService";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

// Helper function to get the appropriate email for a position (mapped emails or personal emails)
const getEmailsForPosition = async (positionTitle) => {
  // First check if there are mapped emails for this position
  const positionMappings = await PositionEmailMapping.find({
    position: positionTitle,
    isActive: true,
  });

  const employees = await Employee.find({
    position: positionTitle,
    isActive: true,
  }).populate("user", "email firstName lastName");

  // Filter employees to only include those with valid email addresses
  const employeesWithValidEmails = employees.filter(
    (emp) =>
      emp.user?.email &&
      emp.user.email !== "no-email@company.com" &&
      emp.user.email.includes("@") &&
      emp.user.email.trim() !== ""
  );

  if (positionMappings && positionMappings.length > 0) {
    // Create a set of mapped employee names for quick lookup
    const mappedEmployeeNames = new Set(
      positionMappings.map((mapping) =>
        mapping.employeeName.toLowerCase().trim()
      )
    );

    // Filter personal emails to only include employees who DON'T have mapped emails
    // An employee should be excluded if their name matches any mapped employee name for this position
    const employeesWithoutMappedEmails = employeesWithValidEmails.filter(
      (emp) => {
        const empName =
          `${emp.user?.firstName || ""} ${emp.user?.lastName || ""}`.trim() ||
          emp.name ||
          "Unknown Employee";
        const empNameLower = empName.toLowerCase().trim();
        return !mappedEmployeeNames.has(empNameLower);
      }
    );

    return {
      mappedEmails: positionMappings.map((mapping) => ({
        email: mapping.email,
        employeeName: mapping.employeeName,
        isMapped: true,
      })),
      personalEmails: employeesWithoutMappedEmails.map((emp) => ({
        email: emp.user.email,
        employeeName:
          `${emp.user?.firstName || ""} ${emp.user?.lastName || ""}`.trim() ||
          emp.name ||
          "Unknown Employee",
        isMapped: false,
      })),
    };
  }

  // No mapped emails, use personal emails only (but only valid ones)
  return {
    mappedEmails: [],
    personalEmails: employeesWithValidEmails.map((emp) => ({
      email: emp.user.email,
      employeeName:
        `${emp.user?.firstName || ""} ${emp.user?.lastName || ""}`.trim() ||
        emp.name ||
        "Unknown Employee",
      isMapped: false,
    })),
  };
};

// Helper function to get sender email (mapped email if user has one, otherwise personal email)
const getSenderEmail = async (user) => {
  // Check if user has an employee record to determine their position
  const employee = await Employee.findOne({ user: user._id, isActive: true });

  if (employee && employee.position) {
    // Check if there are mapped emails for the sender's position
    const positionMappings = await PositionEmailMapping.find({
      position: employee.position,
      isActive: true,
    });

    // If multiple mappings exist, try to find one that matches the user's actual email
    if (positionMappings.length > 0) {
      // First, try to find a mapping that matches the user's email
      const matchingMapping = positionMappings.find(
        (mapping) => mapping.email.toLowerCase() === user.email.toLowerCase()
      );

      if (matchingMapping) {
        return {
          email: matchingMapping.email,
          name: matchingMapping.employeeName,
          isMapped: true,
        };
      }

      // If no exact match, use the first mapping
      const firstMapping = positionMappings[0];
      return {
        email: firstMapping.email,
        name: firstMapping.employeeName,
        isMapped: true,
      };
    }
  }

  // Use personal email if no position mapping
  return {
    email: user.email,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
    isMapped: false,
  };
};

// GET - Get role email mappings for dropdown
export async function GET(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Get URL search params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "get-positions") {
      // Fetch all unique positions with their employees
      const positions = await Employee.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$position",
            employees: {
              $push: {
                name: {
                  $concat: [
                    { $ifNull: ["$firstName", ""] },
                    {
                      $cond: [
                        {
                          $and: [
                            { $ne: ["$firstName", ""] },
                            { $ne: ["$lastName", ""] },
                          ],
                        },
                        " ",
                        "",
                      ],
                    },
                    { $ifNull: ["$lastName", ""] },
                  ],
                },
                fallbackName: "$name",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            position: "$_id",
            employeeNames: {
              $map: {
                input: "$employees",
                as: "emp",
                in: {
                  $cond: [
                    { $ne: ["$$emp.name", ""] },
                    "$$emp.name",
                    { $ifNull: ["$$emp.fallbackName", "Unknown"] },
                  ],
                },
              },
            },
          },
        },
      ]);

      // Format positions for the frontend
      const formattedPositions = positions.map((pos) => ({
        _id: pos._id, // Use position title as ID
        position: pos._id,
        employeeNames: pos.employeeNames,
        // For display purposes, show first employee name
        employeeName:
          pos.employeeNames.length > 0
            ? pos.employeeNames[0]
            : "No Employee Assigned",
      }));

      return NextResponse.json({
        success: true,
        positions: formattedPositions,
      });
    }

    // Default: Get user's mail history
    const mails = await Mail.find({ senderUserId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      mails,
    });
  } catch (error) {
    console.error("GET /api/mail error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch data",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// POST - Send mail
export async function POST(request) {
  try {
    const decoded = getAuthenticatedUser(request);

    await dbConnect();

    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      requestType,
      subject,
      message,
      selectedPositions,
      ccPositions,
      priority,
      selectedDepartment,
      leaveDetails,
      requiresApproval,
    } = body;

    // Validate required fields
    if (
      !requestType ||
      !subject ||
      !message ||
      !selectedPositions ||
      selectedPositions.length === 0 ||
      !selectedDepartment
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Request type, subject, message, department, and at least one recipient are required",
        },
        { status: 400 }
      );
    }

    // Additional validation for leave applications
    if (
      requestType === "Leave Application" &&
      (!leaveDetails ||
        !leaveDetails.leaveType ||
        !leaveDetails.fromDate ||
        !leaveDetails.toDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Leave applications require leave type, from date, and to date",
        },
        { status: 400 }
      );
    }

    // Helper function to get employees for a position and extract their details
    const getEmployeeDetailsForPosition = async (
      positionTitle,
      departmentFilter = null
    ) => {
      const query = {
        position: positionTitle,
        isActive: true,
      };

      // Add department filter if provided
      if (departmentFilter) {
        query.department = departmentFilter;
      }

      const employees = await Employee.find(query).populate(
        "user",
        "email firstName lastName"
      );

      return employees.map((emp) => ({
        email: emp.user?.email || "no-email@company.com",
        employeeName:
          `${emp.user?.firstName || ""} ${emp.user?.lastName || ""}`.trim() ||
          emp.name ||
          "Unknown Employee",
        department: emp.department,
      }));
    };

    // Helper function to get emails for a position with department filtering
    const getEmailsForPositionWithDepartment = async (
      positionTitle,
      departmentFilter = null
    ) => {
      // First check if there are mapped emails for this position
      const positionMappings = await PositionEmailMapping.find({
        position: positionTitle,
        isActive: true,
      });

      const query = {
        position: positionTitle,
        isActive: true,
      };

      // Add department filter if provided
      if (departmentFilter) {
        query.department = departmentFilter;
      }

      const employees = await Employee.find(query).populate(
        "user",
        "email firstName lastName"
      );

      // Filter employees to only include those with valid email addresses
      const employeesWithValidEmails = employees.filter(
        (emp) =>
          emp.user?.email &&
          emp.user.email !== "no-email@company.com" &&
          emp.user.email.includes("@") &&
          emp.user.email.trim() !== ""
      );

      if (positionMappings && positionMappings.length > 0) {
        // Create a set of mapped employee names for quick lookup
        const mappedEmployeeNames = new Set(
          positionMappings.map((mapping) =>
            mapping.employeeName.toLowerCase().trim()
          )
        );

        // Filter personal emails to only include employees who DON'T have mapped emails
        // An employee should be excluded if their name matches any mapped employee name for this position
        const employeesWithoutMappedEmails = employeesWithValidEmails.filter(
          (emp) => {
            const empName =
              `${emp.user?.firstName || ""} ${
                emp.user?.lastName || ""
              }`.trim() ||
              emp.name ||
              "Unknown Employee";
            const empNameLower = empName.toLowerCase().trim();
            return !mappedEmployeeNames.has(empNameLower);
          }
        );

        return {
          mappedEmails: positionMappings.map((mapping) => ({
            email: mapping.email,
            employeeName: mapping.employeeName,
            isMapped: true,
          })),
          personalEmails: employeesWithoutMappedEmails.map((emp) => ({
            email: emp.user.email,
            employeeName:
              `${emp.user?.firstName || ""} ${
                emp.user?.lastName || ""
              }`.trim() ||
              emp.name ||
              "Unknown Employee",
            isMapped: false,
            department: emp.department,
          })),
        };
      }

      // No mapped emails, use personal emails only (but only valid ones)
      return {
        mappedEmails: [],
        personalEmails: employeesWithValidEmails.map((emp) => ({
          email: emp.user.email,
          employeeName:
            `${emp.user?.firstName || ""} ${emp.user?.lastName || ""}`.trim() ||
            emp.name ||
            "Unknown Employee",
          isMapped: false,
          department: emp.department,
        })),
      };
    };

    // Extract position titles from selected position IDs
    const selectedPositionTitles = selectedPositions;

    // Get recipients with employee details
    const recipients = [];
    const emailRecipients = []; // For actual email sending
    for (const positionTitle of selectedPositionTitles) {
      // Always use department filtering since department is now required
      const employeeDetails = await getEmployeeDetailsForPosition(
        positionTitle,
        selectedDepartment
      );
      const emailData = await getEmailsForPositionWithDepartment(
        positionTitle,
        selectedDepartment
      );

      console.log(
        `=== PROCESSING POSITION: ${positionTitle} (Department: ${selectedDepartment}) ===`
      );
      console.log("Employee details:", employeeDetails);
      console.log("Email data - mapped emails:", emailData.mappedEmails);
      console.log("Email data - personal emails:", emailData.personalEmails);

      // For database storage (keep existing functionality)
      if (employeeDetails.length === 0) {
        recipients.push({
          position: positionTitle,
          email: "no-employees@company.com",
          employeeName: "No employees assigned to this position",
        });
      } else {
        employeeDetails.forEach((empDetail) => {
          recipients.push({
            position: positionTitle,
            email: empDetail.email,
            employeeName: empDetail.employeeName,
          });
        });
      }

      // For email sending (new functionality)
      // Use all mapped emails for this position
      if (emailData.mappedEmails && emailData.mappedEmails.length > 0) {
        console.log(
          `Using ${emailData.mappedEmails.length} mapped emails for position: ${positionTitle}`
        );
        emailData.mappedEmails.forEach((mappedEmail) => {
          emailRecipients.push({
            email: mappedEmail.email,
            employeeName: mappedEmail.employeeName,
            position: positionTitle,
            type: "TO",
          });
        });
      }

      // Use personal emails for employees who don't have mapped emails
      if (emailData.personalEmails.length > 0) {
        console.log(
          `Using ${emailData.personalEmails.length} unmapped personal emails for position: ${positionTitle}`
        );
        emailData.personalEmails.forEach((personalEmail) => {
          emailRecipients.push({
            email: personalEmail.email,
            employeeName: personalEmail.employeeName,
            position: positionTitle,
            type: "TO",
          });
        });
      }

      if (
        emailRecipients.filter((r) => r.position === positionTitle).length === 0
      ) {
        console.log(`No valid emails found for position: ${positionTitle}`);
      }
    }

    // Get CC recipients if any
    let ccRecipients = [];
    const emailCcRecipients = []; // For actual email sending
    if (ccPositions && ccPositions.length > 0) {
      const ccPositionTitles = ccPositions;

      for (const positionTitle of ccPositionTitles) {
        // Always use department filtering since department is now required
        const employeeDetails = await getEmployeeDetailsForPosition(
          positionTitle,
          selectedDepartment
        );
        const emailData = await getEmailsForPositionWithDepartment(
          positionTitle,
          selectedDepartment
        );

        console.log(
          `=== PROCESSING CC POSITION: ${positionTitle} (Department: ${selectedDepartment}) ===`
        );
        console.log("CC Employee details:", employeeDetails);
        console.log("CC Email data - mapped emails:", emailData.mappedEmails);
        console.log(
          "CC Email data - personal emails:",
          emailData.personalEmails
        );

        // For database storage (keep existing functionality)
        if (employeeDetails.length === 0) {
          ccRecipients.push({
            position: positionTitle,
            email: "no-employees@company.com",
            employeeName: "No employees assigned to this position",
          });
        } else {
          employeeDetails.forEach((empDetail) => {
            ccRecipients.push({
              position: positionTitle,
              email: empDetail.email,
              employeeName: empDetail.employeeName,
            });
          });
        }

        // For email sending (new functionality)
        // Use all mapped emails for this position
        if (emailData.mappedEmails && emailData.mappedEmails.length > 0) {
          console.log(
            `Using ${emailData.mappedEmails.length} mapped emails for CC position: ${positionTitle}`
          );
          emailData.mappedEmails.forEach((mappedEmail) => {
            emailCcRecipients.push({
              email: mappedEmail.email,
              employeeName: mappedEmail.employeeName,
              position: positionTitle,
              type: "CC",
            });
          });
        }

        // Use personal emails for employees who don't have mapped emails
        if (emailData.personalEmails.length > 0) {
          console.log(
            `Using ${emailData.personalEmails.length} unmapped personal emails for CC position: ${positionTitle}`
          );
          emailData.personalEmails.forEach((personalEmail) => {
            emailCcRecipients.push({
              email: personalEmail.email,
              employeeName: personalEmail.employeeName,
              position: positionTitle,
              type: "CC",
            });
          });
        }

        if (
          emailCcRecipients.filter((r) => r.position === positionTitle)
            .length === 0
        ) {
          console.log(
            `No valid emails found for CC position: ${positionTitle}`
          );
        }
      }
    }

    // Create mail record
    const mail = new Mail({
      senderUserId: decoded.userId,
      senderName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      senderEmail: user.email,
      requestType,
      subject: subject.trim(),
      message: message.trim(),
      recipients,
      ccRecipients,
      priority: priority || "None",
      selectedDepartment: selectedDepartment || null,
      // Add leave-specific fields if it's a leave application
      ...(requestType === "Leave Application" &&
        leaveDetails && {
          leaveDetails: {
            leaveType: leaveDetails.leaveType,
            fromDate: new Date(leaveDetails.fromDate),
            fromSession: leaveDetails.fromSession,
            toDate: new Date(leaveDetails.toDate),
            toSession: leaveDetails.toSession,
          },
          requiresApproval: true,
          approvalStatus: "Pending",
        }),
      emailStatus: "Not Sent",
      emailResults: {
        sent: [],
        failed: [],
      },
    });

    await mail.save();

    // Send actual emails (new functionality)
    let emailResults = { sent: [], failed: [] };

    try {
      console.log("=== MAIL ROUTE: Starting email sending process ===");

      // Get sender email information
      const senderEmailInfo = await getSenderEmail(user);
      const fromEmail = `"${senderEmailInfo.name}" <${senderEmailInfo.email}>`;

      console.log("Sender email info:", senderEmailInfo);
      console.log("Email recipients count:", emailRecipients.length);
      console.log("CC recipients count:", emailCcRecipients.length);

      // Combine TO and CC recipients for email sending
      const allEmailRecipients = [...emailRecipients, ...emailCcRecipients];

      if (allEmailRecipients.length > 0) {
        console.log("=== GENERATING EMAIL TEMPLATE ===");
        // Generate email template
        const { html, text } = generateEmailTemplate({
          senderName: senderEmailInfo.name,
          senderEmail: senderEmailInfo.email,
          requestType,
          subject: subject.trim(),
          message: message.trim(),
          priority: priority || "None",
          leaveDetails,
        });

        // Group recipients by type (TO/CC) for separate emails
        const toRecipients = allEmailRecipients.filter((r) => r.type === "TO");
        const ccOnlyRecipients = allEmailRecipients.filter(
          (r) => r.type === "CC"
        );

        console.log("TO recipients:", toRecipients.length);
        console.log("CC only recipients:", ccOnlyRecipients.length);

        // Send to TO recipients (if any)
        if (toRecipients.length > 0) {
          console.log("=== SENDING TO RECIPIENTS ===");
          const toEmails = toRecipients.map((r) => r.email);
          const ccEmails =
            ccOnlyRecipients.length > 0
              ? ccOnlyRecipients.map((r) => r.email)
              : null;

          console.log("TO emails:", toEmails);
          console.log("CC emails:", ccEmails);

          const { html: toHtml, text: toText } = generateEmailTemplate({
            senderName: senderEmailInfo.name,
            senderEmail: senderEmailInfo.email,
            requestType,
            subject: subject.trim(),
            message: message.trim(),
            priority: priority || "None",
            recipientType: "TO",
            leaveDetails,
          });

          const emailResult = await sendEmail({
            to: toEmails,
            cc: ccEmails,
            from: fromEmail,
            subject: `[${requestType}] ${subject.trim()}`,
            html: toHtml,
            text: toText,
          });

          console.log("Email send result:", emailResult);

          if (emailResult.success) {
            emailResults.sent.push({
              type: "TO",
              recipients: toRecipients.map((r) => r.email),
              cc: ccEmails,
              messageId: emailResult.messageId,
            });
            mail.emailResults.sent.push({
              type: "TO",
              recipients: toRecipients.map((r) => r.email),
              cc: ccEmails || [],
              messageId: emailResult.messageId,
              sentAt: new Date(),
            });
          } else {
            emailResults.failed.push({
              type: "TO",
              recipients: toRecipients.map((r) => r.email),
              error: emailResult.error,
            });
            mail.emailResults.failed.push({
              type: "TO",
              recipients: toRecipients.map((r) => r.email),
              error: emailResult.error,
              failedAt: new Date(),
            });
          }
        }

        // Send separate emails to CC-only recipients (if any and no TO recipients)
        if (ccOnlyRecipients.length > 0 && toRecipients.length === 0) {
          const ccEmails = ccOnlyRecipients.map((r) => r.email);

          const { html: ccHtml, text: ccText } = generateEmailTemplate({
            senderName: senderEmailInfo.name,
            senderEmail: senderEmailInfo.email,
            requestType,
            subject: subject.trim(),
            message: message.trim(),
            priority: priority || "None",
            recipientType: "CC",
            leaveDetails,
          });

          const emailResult = await sendEmail({
            to: ccEmails,
            from: fromEmail,
            subject: `[${requestType}] [CC] ${subject.trim()}`,
            html: ccHtml,
            text: ccText,
          });

          if (emailResult.success) {
            emailResults.sent.push({
              type: "CC_ONLY",
              recipients: ccEmails,
              messageId: emailResult.messageId,
            });
          } else {
            emailResults.failed.push({
              type: "CC_ONLY",
              recipients: ccEmails,
              error: emailResult.error,
            });
          }
        }
      } else {
        console.log("=== NO EMAIL RECIPIENTS FOUND ===");
        console.log("Email recipients:", emailRecipients);
        console.log("CC recipients:", emailCcRecipients);
      }
    } catch (emailError) {
      console.error("=== MAIL ROUTE EMAIL ERROR ===");
      console.error("Error sending emails:", emailError);
      console.error("Error stack:", emailError.stack);
      console.error("=== END MAIL ROUTE EMAIL ERROR ===");
      emailResults.failed.push({
        type: "SYSTEM_ERROR",
        error: emailError.message,
      });
      mail.emailResults.failed.push({
        type: "SYSTEM_ERROR",
        recipients: [],
        error: emailError.message,
        failedAt: new Date(),
      });
    }

    // Update email status based on results
    if (emailResults.sent.length > 0 && emailResults.failed.length === 0) {
      mail.emailStatus = "Sent";
    } else if (emailResults.sent.length > 0 && emailResults.failed.length > 0) {
      mail.emailStatus = "Partially Sent";
    } else if (emailResults.failed.length > 0) {
      mail.emailStatus = "Failed";
    }

    // Save updated mail record with email results
    await mail.save();

    // Log the messaging action for management tracking
    const recipientInfo = recipients.map((r) => {
      return `${r.position} - ${r.employeeName} (${r.email})`;
    });

    const ccInfo = ccRecipients.map((cc) => {
      return `${cc.position} - ${cc.employeeName} (${cc.email})`;
    });

    // Enhanced logging for management tracking
    console.log("=== MESSAGE TRACKING LOG ===");
    console.log("Message ID:", mail._id);
    console.log("Timestamp:", new Date().toISOString());
    console.log(
      "Sender:",
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      `(${user.email})`
    );
    console.log("Request Type:", requestType);
    console.log("Priority:", priority || "None");
    console.log("Subject:", subject);
    console.log("Recipients:", recipientInfo);
    if (ccInfo.length > 0) {
      console.log("CC Recipients:", ccInfo);
    }
    console.log("Message Length:", message.length, "characters");
    console.log("Email Results:", emailResults);
    console.log("=== END MESSAGE LOG ===");

    // Simple success log
    console.log("Message sent successfully:", {
      messageId: mail._id,
      to: recipientInfo,
      cc: ccInfo,
      subject: subject,
      from:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      emailsSent: emailResults.sent.length,
      emailsFailed: emailResults.failed.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        mail: {
          id: mail._id,
          requestType: mail.requestType,
          subject: mail.subject,
          createdAt: mail.createdAt,
          recipients: mail.recipients,
          ccRecipients: mail.ccRecipients,
        },
        emailResults: {
          sent: emailResults?.sent?.length || 0,
          failed: emailResults?.failed?.length || 0,
          details: emailResults || { sent: [], failed: [] },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/mail error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send message",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
