import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters'],
  },
  details: {
    type: String,
    required: [true, 'Project details are required'],
    trim: true,
    maxlength: [5000, 'Project details cannot exceed 5000 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  relatedInfo: {
    mondayBoardLink: { type: String, trim: true },
    ganttChartLink: { type: String, trim: true },
    issueListLink: { type: String, trim: true },
    sampleExcelSheetLink: { type: String, trim: true },
    timeSheetLink: { type: String, trim: true },
    github: {
      backendLink: { type: String, trim: true },
      frontendLink: { type: String, trim: true },
      email: { type: String, trim: true },
      uid: { type: String, trim: true },
      token: { type: String, trim: true },
      password: { type: String, trim: true },
      mainBranch: { type: String, trim: true, default: 'main' },
    },
    homePageLink: { type: String, trim: true },
    adminPanel: {
      link: { type: String, trim: true },
      email: { type: String, trim: true },
      password: { type: String, trim: true },
    },
    notes: { type: String, trim: true },
    dynamicBoxes: [{
      id: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      fields: [{
        id: { type: String, required: true },
        label: { type: String, required: true, trim: true },
        value: { type: String, trim: true }
      }]
    }],
  },
  milestones: [{
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    features: [{
      id: { type: String, required: true },
      topic: { type: String, required: true, trim: true },
      items: [{
        id: { type: String, required: true },
        text: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false }
      }]
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  srsDocument: {
    websiteLink: { type: String, trim: true },
    fileName: { type: String, trim: true },
    filePath: { type: String, trim: true },
    uploadedAt: { type: Date },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  },
  notes: [{
    id: { type: String, required: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

// Index for better performance
projectSchema.index({ name: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ isActive: 1 });

// To prevent the "OverwriteModelError" when the model is already defined.
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

export const Project = mongoose.model('Project', projectSchema);

export default Project;
