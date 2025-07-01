import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/model/User';
import { OTP } from '@/model/OTP';

// Helper function to validate password strength
const validatePassword = (password) => {
  const minLength = password.length > 6;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    isValid: minLength && hasLowerCase && hasUpperCase && hasNumber && hasSymbol,
    errors: {
      minLength,
      hasLowerCase,
      hasUpperCase,
      hasNumber,
      hasSymbol,
    },
  };
};

export async function POST(request) {
  try {
    await dbConnect();
    
    const { email, otp, newPassword } = await request.json();
    
    // Validate required fields
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
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
    
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      const missingRequirements = [];
      if (!passwordValidation.errors.minLength)
        missingRequirements.push('at least 7 characters');
      if (!passwordValidation.errors.hasLowerCase)
        missingRequirements.push('1 lowercase letter');
      if (!passwordValidation.errors.hasUpperCase)
        missingRequirements.push('1 uppercase letter');
      if (!passwordValidation.errors.hasNumber)
        missingRequirements.push('1 number');
      if (!passwordValidation.errors.hasSymbol)
        missingRequirements.push('1 symbol');

      return NextResponse.json(
        { 
          error: `Password must contain ${missingRequirements.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification code or email address' },
        { status: 400 }
      );
    }
    
    // Find the most recent valid OTP for this email
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 }
      );
    }
    
    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 3) {
      // Delete the OTP record from database
      await OTP.findByIdAndDelete(otpRecord._id);
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded. Please request a new code.' },
        { status: 400 }
      );
    }
    
    // Verify OTP
    const isOTPValid = await otpRecord.compareOTP(otp);
    
    if (!isOTPValid) {
      // Increment attempts
      await otpRecord.incrementAttempts();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      if (remainingAttempts > 0) {
        return NextResponse.json(
          { 
            error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
          },
          { status: 400 }
        );
      } else {
        // Delete the OTP record after 3 failed attempts
        await OTP.findByIdAndDelete(otpRecord._id);
        return NextResponse.json(
          { error: 'Maximum verification attempts exceeded. Please request a new code.' },
          { status: 400 }
        );
      }
    }
    
    // OTP is valid, update user password
    user.password = newPassword;
    await user.save();
    
    // Delete the used OTP record from database
    await OTP.findByIdAndDelete(otpRecord._id);
    
    // Delete all other OTPs for this email for security
    await OTP.deleteMany({ 
      email: email.toLowerCase()
    });
    
    console.log(`Password reset successful for email: ${email}`);
    
    return NextResponse.json({
      message: 'Password reset successful. You can now login with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
