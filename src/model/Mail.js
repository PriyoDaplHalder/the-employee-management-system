import mongoose from "mongoose";

const mailSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    requestType: {
      type: String,
      enum: [
        "Leave Application",
        "Work from Home",
        "General Request",
        "Others",
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    // Leave Application specific fields
    leaveDetails: {
      leaveType: {
        type: String,
        enum: ["Loss of Pay", "Comp-off", "Paid Leave"],
      },
      fromDate: Date,
      fromSession: {
        type: String,
        enum: ["first", "second"],
      },
      toDate: Date,
      toSession: {
        type: String,
        enum: ["first", "second"],
      },
    },
    // Work from Home specific fields
    wfhDetails: {
      fromDate: Date,
      toDate: Date,
    },
    // Approval system
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    approvalComments: String,
    recipients: [
      {
        position: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        employeeName: {
          type: String,
          required: true,
        },
      },
    ],
    ccRecipients: [
      {
        position: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        employeeName: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["Sent", "Delivered", "Failed"],
      default: "Sent",
    },
    priority: {
      type: String,
      enum: ["None","Low", "Medium", "High"],
      default: "None",
    },
    selectedDepartment: {
      type: String,
      trim: true,
    },
    emailStatus: {
      type: String,
      enum: ["Not Sent", "Sent", "Partially Sent", "Failed"],
      default: "Not Sent",
    },
    emailResults: {
      sent: [
        {
          type: {
            type: String,
            enum: ["TO", "CC", "CC_ONLY"],
          },
          recipients: [String],
          cc: [String],
          messageId: String,
          sentAt: Date,
        },
      ],
      failed: [
        {
          type: {
            type: String,
            enum: ["TO", "CC", "CC_ONLY", "SYSTEM_ERROR"],
          },
          recipients: [String],
          error: String,
          failedAt: Date,
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

mailSchema.index({ senderUserId: 1, createdAt: -1 });
mailSchema.index({ requestType: 1, createdAt: -1 });
mailSchema.index({ status: 1, createdAt: -1 });
mailSchema.index({ emailStatus: 1, createdAt: -1 });
mailSchema.index({ "recipients.position": 1 });
mailSchema.index({ "ccRecipients.position": 1 });
mailSchema.index({ isActive: 1, createdAt: -1 });

export const Mail = mongoose.models.Mail || mongoose.model("Mail", mailSchema);

export default Mail;
