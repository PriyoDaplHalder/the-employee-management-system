import dbConnect from '@/lib/mongodb';
import { OTP } from '@/model/OTP';

/**
 * Cleanup expired OTPs from the database
 */
export const cleanupExpiredOTPs = async () => {
  try {
    await dbConnect();
    
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} expired OTP records`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    throw error;
  }
};

/**
 * Cleanup all OTPs for a specific email
 * Useful when a user successfully resets password or after maximum attempts
 */
export const cleanupOTPsForEmail = async (email) => {
  try {
    await dbConnect();
    
    const result = await OTP.deleteMany({
      email: email.toLowerCase()
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} OTP records for email: ${email}`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error(`Error cleaning up OTPs for email ${email}:`, error);
    throw error;
  }
};

/**
 * Get OTP statistics for monitoring
 */
export const getOTPStats = async () => {
  try {
    await dbConnect();
    
    const totalOTPs = await OTP.countDocuments();
    const expiredOTPs = await OTP.countDocuments({
      expiresAt: { $lt: new Date() }
    });
    const activeOTPs = totalOTPs - expiredOTPs;
    
    return {
      total: totalOTPs,
      expired: expiredOTPs,
      active: activeOTPs
    };
  } catch (error) {
    console.error('Error getting OTP stats:', error);
    throw error;
  }
};
