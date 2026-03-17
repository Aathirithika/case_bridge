import express from 'express';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// @route   GET /api/admin/pending-lawyers
// @desc    Get all lawyers pending manual verification
// @access  Admin
router.get('/pending-lawyers', async (req, res) => {
    try {
        const pendingLawyers = await User.find({
            role: 'lawyer',
            verificationStatus: 'pending'
        })
        .select('-password')
        .sort({ createdAt: -1 });

        res.json(pendingLawyers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/admin/all-lawyers
// @desc    Get all lawyers with their verification status
// @access  Admin
router.get('/all-lawyers', async (req, res) => {
    try {
        const lawyers = await User.find({ role: 'lawyer' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(lawyers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/admin/verify-lawyer/:id
// @desc    Approve a pending lawyer
// @access  Admin
router.put('/verify-lawyer/:id', async (req, res) => {
    try {
        const lawyer = await User.findById(req.params.id);

        if (!lawyer) {
            return res.status(404).json({ message: 'Lawyer not found' });
        }

        if (lawyer.role !== 'lawyer') {
            return res.status(400).json({ message: 'User is not a lawyer' });
        }

        lawyer.isVerified = true;
        lawyer.verificationStatus = 'approved';
        await lawyer.save();

        res.json({
            message: `Lawyer ${lawyer.name} has been verified successfully.`,
            lawyer: {
                _id: lawyer._id,
                name: lawyer.name,
                email: lawyer.email,
                barCouncilNumber: lawyer.barCouncilNumber,
                isVerified: lawyer.isVerified,
                verificationStatus: lawyer.verificationStatus
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/admin/reject-lawyer/:id
// @desc    Reject a pending lawyer
// @access  Admin
router.put('/reject-lawyer/:id', async (req, res) => {
    try {
        const lawyer = await User.findById(req.params.id);

        if (!lawyer) {
            return res.status(404).json({ message: 'Lawyer not found' });
        }

        if (lawyer.role !== 'lawyer') {
            return res.status(400).json({ message: 'User is not a lawyer' });
        }

        lawyer.isVerified = false;
        lawyer.verificationStatus = 'rejected';
        await lawyer.save();

        res.json({
            message: `Lawyer ${lawyer.name} has been rejected.`,
            lawyer: {
                _id: lawyer._id,
                name: lawyer.name,
                email: lawyer.email,
                barCouncilNumber: lawyer.barCouncilNumber,
                verificationStatus: lawyer.verificationStatus
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
