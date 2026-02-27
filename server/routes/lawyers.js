import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/lawyers
// @desc    Get all verified lawyers or search by query
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { name, specialization, location } = req.query;
        let filter = { role: 'lawyer', isVerified: true };

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (specialization) {
            filter.specializations = { $regex: specialization, $options: 'i' };
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        const lawyers = await User.find(filter)
            .select('-password')
            .sort({ yearsOfExperience: -1, createdAt: -1 });
        res.json(lawyers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/lawyers/recommendations
// @desc    Get recommended lawyers based on specialization or case
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
    try {
        const { specialization, caseId } = req.query;
        let querySpec = specialization;

        // If caseId is provided, find the case and its type
        if (caseId) {
            const Case = (await import('../models/Case.js')).default;
            const caseData = await Case.findById(caseId);
            if (caseData) {
                querySpec = caseData.caseType;
            }
        }

        let filter = { role: 'lawyer', isVerified: true };

        if (querySpec) {
            // Match any specialization that contains the querySpec
            filter.specializations = { $regex: querySpec, $options: 'i' };
        }

        // Return top 4 based on experience and random order for variety
        const lawyers = await User.find(filter)
            .select('-password')
            .sort({ yearsOfExperience: -1 })
            .limit(4);

        // If no matches found, return general top-rated lawyers
        if (lawyers.length === 0) {
            const generalLawyers = await User.find({ role: 'lawyer', isVerified: true })
                .select('-password')
                .sort({ yearsOfExperience: -1 })
                .limit(4);
            return res.json(generalLawyers);
        }

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
