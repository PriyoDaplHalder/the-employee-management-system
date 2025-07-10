import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    unique: true,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  hireDate: {
    type: Date,
    default: Date.now,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  skills: [{
    type: String,
  }],
  performance: [{
    period: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  personalInfo: {
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  profileCompletedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Generate employee ID automatically
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    try {
      // Now this will get the coungt of existing employees and generate a new employee ID
      console.log('Generating employee ID for new employee...');
      const count = await mongoose.model('Employee').countDocuments();
      this.employeeId = `DAPL-${String(count + 1).padStart(4, '0')}`;
      console.log('Generated employee ID:', this.employeeId);
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return next(error);
    }
  }
  next();
});

// Middleware to synchronize employee position changes
employeeSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  
  try {
    // Check if position was modified
    const update = this.getUpdate();
    const newPosition = update.$set?.position || update.position;
    
    if (newPosition && this.getQuery()._id) {
      // Get the old position from the original document
      const originalDoc = await mongoose.model('Employee').findById(this.getQuery()._id).populate('user');
      
      if (originalDoc && originalDoc.position !== newPosition) {
        // Import the synchronization function dynamically to avoid circular dependency
        const { synchronizeEmployeePosition } = await import('@/lib/dataSynchronization');
        
        await synchronizeEmployeePosition(
          originalDoc.user._id.toString(), 
          originalDoc.position, 
          newPosition
        );
        console.log(`Synchronized position change for employee ${originalDoc._id}: ${originalDoc.position} -> ${newPosition}`);
      }
    }
  } catch (error) {
    console.error('Error in Employee post-update middleware:', error);
    // Don't throw error to avoid breaking the update operation
  }
});

export const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
