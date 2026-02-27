import express from 'express';
import IPCSection from '../models/IPCSection.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/ipc
// @desc    Get all IPC sections or search by query
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { query } = req.query;
        let filter = {};

        if (query) {
            filter = {
                $or: [
                    { sectionNumber: { $regex: query, $options: 'i' } },
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            };
        }

        const sections = await IPCSection.find(filter).sort({ sectionNumber: 1 });
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/ipc/:sectionNumber
// @desc    Get specific IPC section by number
// @access  Private
router.get('/:sectionNumber', protect, async (req, res) => {
    try {
        const section = await IPCSection.findOne({ sectionNumber: req.params.sectionNumber });
        if (section) {
            res.json(section);
        } else {
            res.status(404).json({ message: 'IPC Section not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
