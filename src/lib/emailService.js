import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email function
export const sendEmail = async ({ to, cc, from, subject, html, text }) => {
  try {
    console.log("=== EMAIL SEND ATTEMPT ===");
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER
        ? process.env.SMTP_USER.substring(0, 5) + "***"
        : "NOT_SET",
      pass: process.env.SMTP_PASS ? "***SET***" : "NOT_SET",
    });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        "SMTP credentials not configured. Please check SMTP_USER and SMTP_PASS environment variables."
      );
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("Email server is ready to take our messages");

    const mailOptions = {
      from:
        from ||
        `"${process.env.DEFAULT_FROM_NAME}" <${process.env.DEFAULT_FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      cc: cc && Array.isArray(cc) ? cc.join(", ") : cc,
      subject,
      html,
      text,
    };

    console.log("Mail options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
    });

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    return { success: false, error: error.message };
  }
};

// Generate HTML email template
export const generateEmailTemplate = ({
  senderName,
  senderEmail,
  requestType,
  subject,
  message,
  priority,
  recipientType = "TO",
  leaveDetails,
  wfhDetails,
}) => {
  const priorityColor = {
    Low: "#28a745",
    Medium: "#ffc107",
    High: "#fd7e14",
    Critical: "#dc3545",
  };

  // Add leave summary if leaveDetails is present and requestType is Leave Application
  let leaveSummary = "";
  if (requestType === "Leave Application" && leaveDetails) {
    leaveSummary = `
      <div style="margin: 15px 0;">
        <strong>Leave Type:</strong> ${leaveDetails.leaveType}<br/>
        <strong>From:</strong> ${new Date(leaveDetails.fromDate).toLocaleDateString()} (${leaveDetails.fromSession} session)<br/>
        <strong>To:</strong> ${new Date(leaveDetails.toDate).toLocaleDateString()} (${leaveDetails.toSession} session)
      </div>
    `;
  }

  // Add WFH summary if wfhDetails is present and requestType is Work from Home
  let wfhSummary = "";
  if (requestType === "Work from Home" && wfhDetails) {
    wfhSummary = `
      <div style="margin: 15px 0;">
        <strong>From Date:</strong> ${new Date(wfhDetails.fromDate).toLocaleDateString()}<br/>
        <strong>To Date:</strong> ${new Date(wfhDetails.toDate).toLocaleDateString()}
      </div>
    `;
  }

  // Handle WFH Response emails
  if (requestType === "Work from Home Response" && wfhDetails) {
    wfhSummary = `
      <div style="margin: 15px 0;">
        <strong>WFH Period:</strong><br/>
        <strong>From Date:</strong> ${new Date(wfhDetails.fromDate).toLocaleDateString()}<br/>
        <strong>To Date:</strong> ${new Date(wfhDetails.toDate).toLocaleDateString()}
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .email-header {
          background-color: #007bff;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .email-content {
          background-color: white;
          padding: 20px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .priority-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: bold;
          background-color: ${priorityColor[priority] || "#6c757d"};
        }
        .message-content {
          background-color: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #007bff;
          margin: 15px 0;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e9ecef;
          font-size: 12px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h2>Managix</h2>
          <p>${requestType} request</p>
        </div>
        <div class="email-content">
          <h3>Subject: ${subject}</h3>
          
          ${requestType !== "Leave Application" && requestType !== "Leave Application Response" && requestType !== "Work from Home" && requestType !== "Work from Home Response" ? `<div style="margin: 15px 0;">
            <strong>Priority:</strong> <span class="priority-badge">${priority}</span>
          </div>` : ''}
          
          <div style="margin: 15px 0;">
            <strong>Request Type:</strong> ${requestType}
          </div>

          ${leaveSummary}
          ${wfhSummary}

          <div style="margin: 15px 0;">
            <strong>From:</strong> ${senderName} (${senderEmail})
          </div>
          
          <div style="margin: 15px 0;">
            <strong>Message:</strong>
            <div class="message-content">${message}</div>
          </div>
          
          <div class="footer">
            <p>This email was sent from the Managix.</p>
            <p>Please respond to this request through the Managix portal.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Generate plain text version
  let leaveSummaryText = "";
  if (requestType === "Leave Application" && leaveDetails) {
    leaveSummaryText = `\nLeave Type: ${leaveDetails.leaveType}\nFrom: ${new Date(leaveDetails.fromDate).toLocaleDateString()} (${leaveDetails.fromSession} session)\nTo: ${new Date(leaveDetails.toDate).toLocaleDateString()} (${leaveDetails.toSession} session)`;
  }

  let wfhSummaryText = "";
  if (requestType === "Work from Home" && wfhDetails) {
    wfhSummaryText = `\nFrom Date: ${new Date(wfhDetails.fromDate).toLocaleDateString()}\nTo Date: ${new Date(wfhDetails.toDate).toLocaleDateString()}`;
  }

  // Handle WFH Response emails
  if (requestType === "Work from Home Response" && wfhDetails) {
    wfhSummaryText = `\nWFH Period:\nFrom Date: ${new Date(wfhDetails.fromDate).toLocaleDateString()}\nTo Date: ${new Date(wfhDetails.toDate).toLocaleDateString()}`;
  }

  const text = `
    Managix - New ${requestType} Request

    Subject: ${subject}
    ${requestType !== "Leave Application" && requestType !== "Leave Application Response" && requestType !== "Work from Home" && requestType !== "Work from Home Response" ? `Priority: ${priority}` : ''}
    From: ${senderName} (${senderEmail})
    Recipient Type: ${recipientType}
    ${leaveSummaryText}${wfhSummaryText}
    
    Message:
    ${message}

    This email was sent from the Managix.
    Please respond to this request through the Managix portal.
  `;

  return { html, text };
};
