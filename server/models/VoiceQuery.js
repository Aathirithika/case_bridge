import mongoose from 'mongoose';

const voiceQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Original voice input
  originalQuery: {
    type: String,
    required: true,
  },

  // Processed query
  simplifiedQuery: {
    type: String,
  },

  // Language used
  language: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'],
    default: 'en',
  },

  // Detected category
  category: {
    type: String,
    enum: ['family', 'property', 'criminal', 'business', 'civil', 'labor', 'consumer', 'other'],
  },

  // Urgency level
  urgency: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal',
  },

  // Extracted entities
  entities: {
    persons: [String],
    locations: [String],
    amounts: [String],
    dates: [String],
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'pending',
  },

  // Assigned lawyer
  assignedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Audio file path (if stored)
  audioFilePath: {
    type: String,
  },

  // Suggested questions for lawyer
  suggestedQuestions: [String],

  // Completeness score
  completenessScore: {
    type: Number,
    min: 0,
    max: 100,
  },

  // Admin notes
  notes: {
    type: String,
  },

  // Response from lawyer
  lawyerResponse: {
    type: String,
  },

  // Timestamps for tracking
  assignedAt: {
    type: Date,
  },

  resolvedAt: {
    type: Date,
  },

}, {
  timestamps: true,
});

// Index for efficient queries
voiceQuerySchema.index({ userId: 1, status: 1 });
voiceQuerySchema.index({ assignedLawyer: 1, status: 1 });
voiceQuerySchema.index({ category: 1, urgency: -1 });
voiceQuerySchema.index({ createdAt: -1 });

// Method to assign lawyer
voiceQuerySchema.methods.assignToLawyer = async function(lawyerId) {
  this.assignedLawyer = lawyerId;
  this.status = 'assigned';
  this.assignedAt = new Date();
  return await this.save();
};

// Method to mark as resolved
voiceQuerySchema.methods.markResolved = async function(response) {
  this.status = 'resolved';
  this.lawyerResponse = response;
  this.resolvedAt = new Date();
  return await this.save();
};

// Static method to get pending queries
voiceQuerySchema.statics.getPendingQueries = function() {
  return this.find({ status: 'pending' })
    .populate('userId', 'name email language')
    .sort({ urgency: -1, createdAt: -1 });
};

// Static method to get lawyer's assigned queries
voiceQuerySchema.statics.getLawyerQueries = function(lawyerId) {
  return this.find({ 
    assignedLawyer: lawyerId,
    status: { $in: ['assigned', 'in_progress'] }
  })
    .populate('userId', 'name email phone')
    .sort({ urgency: -1, createdAt: -1 });
};

const VoiceQuery = mongoose.model('VoiceQuery', voiceQuerySchema);

export default VoiceQuery;