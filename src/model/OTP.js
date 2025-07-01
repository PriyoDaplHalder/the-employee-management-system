import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index to auto-delete expired documents
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3, // Maximum 3 attempts allowed
  },
}, {
  timestamps: true,
});

// Hash OTP before saving for security
otpSchema.pre('save', async function(next) {
  if (!this.isModified('otp')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare OTP
otpSchema.methods.compareOTP = async function(candidateOTP) {
  return bcrypt.compare(candidateOTP, this.otp);
};

// Method to check if OTP is valid (not expired)
otpSchema.methods.isValid = function() {
  return this.expiresAt > new Date() && this.attempts < 3;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Index to ensure efficient querying
otpSchema.index({ email: 1, expiresAt: 1 });

export const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
