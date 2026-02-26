import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
    caseNumber: {
        type: String,
        required: true,
        unique: true,
    },
    caseType: {
        type: String,
        required: true,
        enum: ['Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law', 'Property Law', 'Consumer Law', 'Tax Law', 'Labour Law', 'General Consultation', 'Other'],
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lawyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'in_progress', 'closed'],
        default: 'submitted',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    documents: [{
        fileName: String,
        fileUrl: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    remarks: [{
        text: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    submissionMethod: {
        type: String,
        enum: ['voice', 'text', 'form'],
        default: 'form',
    },
    voiceTranscript: String,
    nlpAnalysis: {
        detectedCategory: String,
        urgencyLevel: String,
        language: String,
        confidence: Number,
    },
}, {
    timestamps: true,
});

// Auto-generate case number before validation
caseSchema.pre('validate', async function () {
    if (!this.caseNumber) {
        const count = await mongoose.model('Case').countDocuments();
        const year = new Date().getFullYear();
        this.caseNumber = `CB${year}${String(count + 1).padStart(5, '0')}`;
    }
});

const Case = mongoose.model('Case', caseSchema);

export default Case;
