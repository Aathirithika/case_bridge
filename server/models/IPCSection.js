import mongoose from 'mongoose';

const ipcSectionSchema = new mongoose.Schema({
    sectionNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    punishment: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Criminal', 'Civil', 'Family', 'Property', 'Corporate', 'Other'],
        default: 'Criminal'
    }
}, {
    timestamps: true
});

const IPCSection = mongoose.model('IPCSection', ipcSectionSchema);

export default IPCSection;
