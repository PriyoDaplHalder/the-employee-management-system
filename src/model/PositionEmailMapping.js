import mongoose from 'mongoose';

const positionEmailMappingSchema = new mongoose.Schema({
  position: {
    type: String,
    required: true,
    trim: true,
  },
  employeeName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Create compound unique index for position + email combination (only for active records)
// This allows multiple employees in the same position, but prevents duplicate email mappings
positionEmailMappingSchema.index(
  { position: 1, email: 1 }, 
  { unique: true, partialFilterExpression: { isActive: true } }
);
positionEmailMappingSchema.index({ position: 1 });
positionEmailMappingSchema.index({ isActive: 1 });

export const PositionEmailMapping = mongoose.models.PositionEmailMapping || mongoose.model('PositionEmailMapping', positionEmailMappingSchema);

export default PositionEmailMapping;
