import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Basic Information Permissions
  canEditBasicInfo: {
    type: Boolean,
    default: false,
  },
  basicInfoFields: {
    firstName: { type: Boolean, default: false },
    lastName: { type: Boolean, default: false },
  },
  // Personal Information Permissions
  canEditPersonalInfo: {
    type: Boolean,
    default: false,
  },
  personalInfoFields: {
    phone: { type: Boolean, default: false },
    address: { type: Boolean, default: false },
    emergencyContact: { type: Boolean, default: false },
    skills: { type: Boolean, default: false },
  },
  // Project Permissions
  canEditProjectMilestone: {
    type: Boolean,
    default: false,
  },
  canEditProjectSRS: {
    type: Boolean,
    default: false,
  },
  // Permission metadata
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  grantedAt: {
    type: Date,
    default: Date.now,
  },
  revokedAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  reason: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one active permission per employee
permissionSchema.index({ employee: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);
