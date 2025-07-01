import { NextResponse } from 'next/server';
import { cleanupExpiredOTPs, getOTPStats } from '@/lib/otpUtils';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

export async function POST(request) {
  try {
    // Verify admin access
    const token = getTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'management') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Cleanup expired OTPs
    const deletedCount = await cleanupExpiredOTPs();
    
    return NextResponse.json({
      message: 'OTP cleanup completed successfully',
      deletedCount
    });
    
  } catch (error) {
    console.error('OTP cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Verify admin access
    const token = getTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'management') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get OTP statistics
    const stats = await getOTPStats();
    
    return NextResponse.json({
      message: 'OTP statistics retrieved successfully',
      stats
    });
    
  } catch (error) {
    console.error('OTP stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
