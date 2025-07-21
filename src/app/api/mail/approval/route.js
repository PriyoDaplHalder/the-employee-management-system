import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Mail } from "@/model/Mail";
import { User } from "@/model/User";
import { Employee } from "@/model/Employee";
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

// POST - Approve or reject leave application
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
    const { mailId, action, comments } = body; // action: 'approve' or 'reject'

    // Validate required fields
    if (!mailId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Mail ID and valid action (approve/reject) are required",
        },
        { status: 400 }
      );
    }

    // Find the mail record
    const mail = await Mail.findById(mailId).populate(
      "senderUserId",
      "firstName lastName email"
    );
    if (!mail) {
      return NextResponse.json(
        {
          success: false,
          error: "Mail not found",
        },
        { status: 404 }
      );
    }

    // Check if this is a leave application that requires approval
    if (mail.requestType !== "Leave Application" || !mail.requiresApproval) {
      return NextResponse.json(
        {
          success: false,
          error: "This mail does not require approval",
        },
        { status: 400 }
      );
    }

    // Check if the user is authorized to approve/reject (must be in the TO recipients)
    const userEmployee = await Employee.findOne({ user: decoded.userId });
    if (!userEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee record not found",
        },
        { status: 404 }
      );
    }

    const canApprove = mail.recipients.some(
      (recipient) => recipient.position === userEmployee.position
    );

    if (!canApprove) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorized to approve/reject this leave application",
        },
        { status: 403 }
      );
    }

    // Check if already processed
    if (mail.approvalStatus !== "Pending") {
      return NextResponse.json(
        {
          success: false,
          error: `This leave application has already been ${mail.approvalStatus.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    // Update approval status
    const approvalStatus = action === "approve" ? "Approved" : "Rejected";
    mail.approvalStatus = approvalStatus;
    mail.approvedBy = decoded.userId;
    mail.approvedAt = new Date();
    mail.approvalComments = comments || "";

    await mail.save();

    // Send notification email to the original sender
    try {
      const senderName =
        `${mail.senderUserId.firstName || ""} ${
          mail.senderUserId.lastName || ""
        }`.trim() || mail.senderUserId.email;
      const approverName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

      // Create leave summary for email
      const leaveSummary = mail.leaveDetails
        ? `
        Leave Type: ${mail.leaveDetails.leaveType}
        From: ${new Date(mail.leaveDetails.fromDate).toLocaleDateString()} (${
            mail.leaveDetails.fromSession
          } session)
        To: ${new Date(mail.leaveDetails.toDate).toLocaleDateString()} (${
            mail.leaveDetails.toSession
          } session)
      `
        : "";

      const emailSubject = `Leave Application ${approvalStatus} - ${mail.subject}`;
      const emailMessage = `
Dear ${senderName},

Your leave application has been ${approvalStatus.toLowerCase()} by ${approverName}.

Original Request:
${leaveSummary}
Subject: ${mail.subject}
Message: ${mail.message}

${comments ? `Approver Comments: ${comments}` : ""}

Status: ${approvalStatus}
Processed on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

Best regards,
${approverName}
      `;

      const { html, text } = generateEmailTemplate({
        senderName: approverName,
        senderEmail: user.email,
        requestType: "Leave Application Response",
        subject: emailSubject,
        message: emailMessage.trim(),
        priority: "High",
      });

      await sendEmail({
        to: mail.senderUserId.email,
        from: `"${approverName}" <${user.email}>`,
        subject: emailSubject,
        html,
        text,
      });

      console.log(
        `Leave ${action} notification sent to ${mail.senderUserId.email}`
      );
    } catch (emailError) {
      console.error("Failed to send approval notification email:", emailError);
      // Don't fail the approval process if email fails
    }

    // Log the approval action
    console.log("=== LEAVE APPROVAL LOG ===");
    console.log("Mail ID:", mailId);
    console.log("Action:", approvalStatus);
    console.log(
      "Approver:",
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    );
    console.log(
      "Applicant:",
      `${mail.senderUserId.firstName || ""} ${
        mail.senderUserId.lastName || ""
      }`.trim() || mail.senderUserId.email
    );
    console.log("Timestamp:", new Date().toISOString());
    if (comments) {
      console.log("Comments:", comments);
    }
    console.log("=== END LEAVE APPROVAL LOG ===");

    return NextResponse.json(
      {
        success: true,
        message: `Leave application ${action}d successfully`,
        approval: {
          mailId: mail._id,
          status: approvalStatus,
          approvedBy:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
          approvedAt: mail.approvedAt,
          comments: comments || "",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/mail/approval error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process approval",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}

// GET - Get pending approvals for the current user
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

    // Get user's employee record to find their position
    const userEmployee = await Employee.findOne({ user: decoded.userId });
    if (!userEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee record not found",
        },
        { status: 404 }
      );
    }

    // Find leave applications pending approval where user's position is in recipients
    const pendingApprovals = await Mail.find({
      requestType: "Leave Application",
      requiresApproval: true,
      approvalStatus: "Pending",
      "recipients.position": userEmployee.position,
      isActive: true,
    })
      .populate("senderUserId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50);

    const enrichedApprovals = pendingApprovals.map((mail) => ({
      _id: mail._id,
      subject: mail.subject,
      message: mail.message,
      leaveDetails: mail.leaveDetails,
      applicant: {
        name:
          `${mail.senderUserId.firstName || ""} ${
            mail.senderUserId.lastName || ""
          }`.trim() || mail.senderUserId.email,
        email: mail.senderUserId.email,
      },
      appliedAt: mail.createdAt,
      priority: mail.priority,
    }));

    return NextResponse.json(
      {
        success: true,
        pendingApprovals: enrichedApprovals,
        count: enrichedApprovals.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/mail/approval error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch pending approvals",
      },
      { status: error.message === "No token provided" ? 401 : 500 }
    );
  }
}
