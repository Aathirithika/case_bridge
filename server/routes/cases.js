import express from 'express';
import Case from '../models/Case.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/cases
// @desc    Get all cases for logged-in user (lawyer or client)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Get filter parameters from query
        const { status, caseType, priority } = req.query;

        // Build filter query based on role
        const filter = {};
        if (req.user.role === 'lawyer') {
            filter.lawyer = req.user._id;
        } else if (req.user.role === 'client') {
            filter.client = req.user._id;
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (status) filter.status = status;
        if (caseType) filter.caseType = caseType;
        if (priority) filter.priority = priority;

        // Get cases with details populated
        const cases = await Case.find(filter)
            .populate('client', 'name email phone')
            .populate('lawyer', 'name email phone specializations barCouncilNumber')
            .sort({ createdAt: -1 });

        // Get statistics
        const statsFilter = { ...filter };
        const totalCases = await Case.countDocuments(statsFilter);
        const activeCases = await Case.countDocuments({
            ...statsFilter,
            status: { $in: ['under_review', 'in_progress'] }
        });
        const completedCases = await Case.countDocuments({
            ...statsFilter,
            status: 'closed'
        });

        // Get statistics for dashboard overview
        let statistics = {
            totalCases,
            activeCases,
            completedCases
        };

        if (req.user.role === 'lawyer') {
            const totalClients = await Case.distinct('client', { lawyer: req.user._id });
            statistics.totalClients = totalClients.length;
        }

        res.json({
            cases,
            statistics
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/cases/:id
// @desc    Get specific case details
// @access  Private (Lawyer/Client)
router.get('/:id', protect, async (req, res) => {
    try {
        const caseData = await Case.findById(req.params.id)
            .populate('client', 'name email phone')
            .populate('lawyer', 'name email barCouncilNumber specializations')
            .populate('remarks.addedBy', 'name role')
            .populate('documents.uploadedBy', 'name role');

        if (!caseData) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Check if user has access to this case
        if (req.user.role === 'lawyer' && caseData.lawyer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.user.role === 'client' && caseData.client._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(caseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/cases/:id/status
// @desc    Update case status
// @access  Private (Lawyer only)
router.put('/:id/status', protect, async (req, res) => {
    try {
        // Check if user is a lawyer
        if (req.user.role !== 'lawyer') {
            return res.status(403).json({ message: 'Access denied. Lawyers only.' });
        }

        const { status } = req.body;

        if (!['submitted', 'under_review', 'in_progress', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const caseData = await Case.findById(req.params.id);

        if (!caseData) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Check if this case belongs to the lawyer
        if (caseData.lawyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        caseData.status = status;
        await caseData.save();

        res.json({
            message: 'Case status updated successfully',
            case: caseData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/cases/:id/remarks
// @desc    Add remark to case
// @access  Private (Lawyer/Client)
router.post('/:id/remarks', protect, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Remark text is required' });
        }

        const caseData = await Case.findById(req.params.id);

        if (!caseData) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Check if user has access to this case
        if (req.user.role === 'lawyer' && caseData.lawyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.user.role === 'client' && caseData.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        caseData.remarks.push({
            text,
            addedBy: req.user._id,
            addedAt: new Date(),
        });

        await caseData.save();

        // Populate the newly added remark
        await caseData.populate('remarks.addedBy', 'name role');

        res.json({
            message: 'Remark added successfully',
            case: caseData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/cases
// @desc    Create new case
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            caseType,
            title,
            description,
            clientId,
            lawyerId,
            priority,
            submissionMethod,
            voiceTranscript,
            nlpAnalysis,
            documents
        } = req.body;

        // Process documents if provided
        const processedDocuments = documents ? documents.map(doc => ({
            fileName: doc.fileName,
            fileUrl: doc.fileData, // Store base64 data directly
            uploadedBy: clientId,
            uploadedAt: new Date()
        })) : [];

        const newCase = await Case.create({
            caseType,
            title,
            description,
            client: clientId,
            lawyer: lawyerId,
            priority: priority || 'medium',
            status: 'submitted',
            submissionMethod: submissionMethod || 'form',
            voiceTranscript,
            nlpAnalysis,
            documents: processedDocuments
        });

        await newCase.populate('client', 'name email');
        await newCase.populate('lawyer', 'name email');

        res.status(201).json({
            message: 'Case created successfully',
            case: newCase
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
