import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/model/User';
import { OTP } from '@/model/OTP';
import { sendEmail } from '@/lib/emailService';

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to generate OTP email template
const generateOTPEmailTemplate = (otp) => {
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
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .otp-code {
          background-color: #f8f9fa;
          border: 2px dashed #007bff;
          padding: 20px;
          margin: 20px 0;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #007bff;
          border-radius: 8px;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          color: #856404;
        }
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e9ecef;
          font-size: 12px;
          color: #6c757d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h2>Managix</h2>
          <p>Password Reset Request</p>
        </div>
        <div class="email-content">
          <h3>Password Reset Verification Code</h3>
          <p>You have requested to reset your password. Please use the following verification code:</p>
          
          <div class="otp-code">${otp}</div>
          
          <div class="warning">
            <strong>Important:</strong>
            <ul style="text-align: left; margin: 10px 0;">
              <li>This code will expire in 5 minutes</li>
              <li>This code can only be used once</li>
              <li>You have maximum 3 attempts to enter the correct code</li>
              <li>If you did not request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>Enter this code along with your new password to complete the password reset process.</p>
          
          <div class="footer">
            <p>This email was sent from Managix.</p>
            <p>If you did not request a password reset, please contact your administrator immediately.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Managix - Password Reset Request

    You have requested to reset your password. Please use the following verification code:
    
    Verification Code: ${otp}
    
    Important:
    - This code will expire in 5 minutes
    - This code can only be used once
    - You have maximum 3 attempts to enter the correct code
    - If you did not request this, please ignore this email
    
    Enter this code along with your new password to complete the password reset process.
    
    If you did not request a password reset, please contact your administrator immediately.
  `;

  return { html, text };
};

export async function POST(request) {
  try {
    await dbConnect();
    
    const { email } = await request.json();
    
    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Check if user exists (but don't reveal this information in response)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success message to prevent email enumeration
    // But only send OTP if user actually exists
    if (user) {
      // Delete any existing OTPs for this email (expired or active)
      await OTP.deleteMany({ email: email.toLowerCase() });
      
      // Generate new OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
      // Create new OTP record
      const otpRecord = new OTP({
        email: email.toLowerCase(),
        otp: otpCode,
        expiresAt,
      });
      
      await otpRecord.save();
      
      // Send OTP email
      const { html, text } = generateOTPEmailTemplate(otpCode);
      const emailResult = await sendEmail({
        to: email,
        subject: 'Password Reset Verification Code - Managix',
        html,
        text,
      });
      
      if (!emailResult.success) {
        console.error('Failed to send OTP email:', emailResult.error);
        // Delete the OTP record if email failed to send
        await OTP.findByIdAndDelete(otpRecord._id);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }
      
      console.log(`OTP sent successfully to ${email}`);
    } else {
      console.log(`Password reset attempted for non-existent email: ${email}`);
    }
    
    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with this email exists, a verification code has been sent to your email address.'
    });
    
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
