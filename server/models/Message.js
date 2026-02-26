import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    case: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'system'],
        default: 'text'
    },
    content: {
        type: String,
        required: function () {
            return this.messageType === 'text' || this.messageType === 'system';
        }
    },
    fileUrl: {
        type: String,
        required: function () {
            return this.messageType === 'file';
        }
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    readStatus: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
messageSchema.index({ case: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, readStatus: 1 });

// Pre-save hook to auto-populate sender and receiver details
messageSchema.pre('save', async function () {
    if (this.readStatus && !this.readAt) {
        this.readAt = new Date();
    }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
