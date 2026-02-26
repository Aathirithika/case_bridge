import mongoose from 'mongoose';

const barCouncilSchema = new mongoose.Schema({
    barCouncilNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    lawyerName: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    enrollmentDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});

const BarCouncil = mongoose.model('BarCouncil', barCouncilSchema);

export default BarCouncil;
