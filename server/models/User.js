import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['client', 'lawyer', 'admin'],
    default: 'client',
  },

  // Language preference for accessibility
  language: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'],
    default: 'en',
  },

  // Phone number for communication
  phone: {
    type: String,
  },

  // Location
  city: {
    type: String,
  },
  state: {
    type: String,
  },

  // Verification status
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Lawyer specific fields (at top level for consistency with auth controller)
  barCouncilNumber: {
    type: String,
    sparse: true
  },
  yearsOfExperience: {
    type: Number,
  },
  location: {
    type: String,
  },
  specializations: {
    type: [String],
    default: []
  },

  // Legacy fields (kept for backward compatibility if needed)
  lawyerProfile: {
    barCouncilId: String,
    specialization: [String],
    experience: Number,
    practiceAreas: [String],
    languages: [String],
    availability: {
      type: Boolean,
      default: true,
    },
  },

  // Client-specific fields
  clientProfile: {
    preferredLanguage: String,
    needsVoiceAssistance: {
      type: Boolean,
      default: false,
    },
  },

}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to update language preference
userSchema.methods.updateLanguage = async function (newLanguage) {
  this.language = newLanguage;
  return await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;