import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/lawyers
// @desc    Get all verified lawyers
// @access  Private (Client/Lawyer/Admin)
router.get('/', protect, async (req, res) => {
    try {
        const lawyers = await User.find({ role: 'lawyer', isVerified: true })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(lawyers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/lawyers/:id
// @desc    Get lawyer by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const lawyer = await User.findById(req.params.id).select('-password');
        if (lawyer && lawyer.role === 'lawyer') {
            res.json(lawyer);
        } else {
            res.status(404).json({ message: 'Lawyer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
