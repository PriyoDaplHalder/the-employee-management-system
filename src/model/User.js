import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['employee', 'management'],
    required: [true, 'Role is required'],
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Only to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware to synchronize employee name changes
userSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  
  try {
    // Only proceed if firstName or lastName was modified
    const update = this.getUpdate();
    const hasNameChange = (update.$set && (update.$set.firstName || update.$set.lastName)) ||
                         (update.firstName !== undefined || update.lastName !== undefined);
    
    if (hasNameChange) {
      // Import the synchronization function dynamically to avoid circular dependency
      const { synchronizeEmployeeName } = await import('@/lib/dataSynchronization');
      
      const newFirstName = update.$set?.firstName || update.firstName || doc.firstName;
      const newLastName = update.$set?.lastName || update.lastName || doc.lastName;
      
      if (newFirstName && newLastName) {
        await synchronizeEmployeeName(doc._id.toString(), newFirstName, newLastName);
        console.log(`Synchronized name change for user ${doc._id}`);
      }
    }
  } catch (error) {
    console.error('Error in User post-update middleware:', error);
    // Don't throw error to avoid breaking the update operation
  }
});

// Checking password after bcrypt hash and comparing
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output for security purposes
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
