import express from 'express';
import VoiceQuery from '../models/VoiceQuery.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/voice/query
// @desc    Submit a new voice query
// @access  Private
router.post('/query', protect, async (req, res) => {
  try {
    const { 
      originalQuery, 
      simplifiedQuery,
      language, 
      category, 
      urgency,
      entities,
      suggestedQuestions,
      completenessScore
    } = req.body;

    // Validate required fields
    if (!originalQuery) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Create new voice query
    const voiceQuery = await VoiceQuery.create({
      userId: req.user._id,
      originalQuery,
      simplifiedQuery,
      language: language || req.user.language || 'en',
      category: category || 'other',
      urgency: urgency || 'normal',
      entities: entities || {},
      suggestedQuestions: suggestedQuestions || [],
      completenessScore: completenessScore || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      query: voiceQuery,
    });
  } catch (error) {
    console.error('Error submitting voice query:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/voice/my-queries
// @desc    Get user's voice queries
// @access  Private
router.get('/my-queries', protect, async (req, res) => {
  try {
    const queries = await VoiceQuery.find({ userId: req.user._id })
      .populate('assignedLawyer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: queries.length,
      queries,
    });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/voice/pending
// @desc    Get all pending voice queries (for lawyers/admins)
// @access  Private (Lawyer/Admin)
router.get('/pending', protect, async (req, res) => {
  try {
    // Check if user is lawyer or admin
    if (req.user.role !== 'lawyer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const queries = await VoiceQuery.getPendingQueries();

    res.json({
      success: true,
      count: queries.length,
      queries,
    });
  } catch (error) {
    console.error('Error fetching pending queries:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/voice/assigned
// @desc    Get lawyer's assigned queries
// @access  Private (Lawyer)
router.get('/assigned', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const queries = await VoiceQuery.getLawyerQueries(req.user._id);

    res.json({
      success: true,
      count: queries.length,
      queries,
    });
  } catch (error) {
    console.error('Error fetching assigned queries:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/voice/assign/:queryId
// @desc    Assign query to lawyer
// @access  Private (Lawyer)
router.put('/assign/:queryId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = await VoiceQuery.findById(req.params.queryId);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    if (query.status !== 'pending') {
      return res.status(400).json({ message: 'Query already assigned' });
    }

    await query.assignToLawyer(req.user._id);

    res.json({
      success: true,
      message: 'Query assigned successfully',
      query,
    });
  } catch (error) {
    console.error('Error assigning query:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/voice/respond/:queryId
// @desc    Respond to a query
// @access  Private (Lawyer)
router.put('/respond/:queryId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { response, status } = req.body;

    const query = await VoiceQuery.findById(req.params.queryId);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    if (query.assignedLawyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this query' });
    }

    query.lawyerResponse = response;
    query.status = status || 'in_progress';
    
    if (status === 'resolved') {
      query.resolvedAt = new Date();
    }

    await query.save();

    res.json({
      success: true,
      message: 'Response submitted successfully',
      query,
    });
  } catch (error) {
    console.error('Error responding to query:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/voice/query/:queryId
// @desc    Get single query details
// @access  Private
router.get('/query/:queryId', protect, async (req, res) => {
  try {
    const query = await VoiceQuery.findById(req.params.queryId)
      .populate('userId', 'name email phone')
      .populate('assignedLawyer', 'name email phone');

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Check authorization
    if (
      query.userId._id.toString() !== req.user._id.toString() &&
      (!query.assignedLawyer || query.assignedLawyer._id.toString() !== req.user._id.toString()) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      query,
    });
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/voice/query/:queryId
// @desc    Delete a query
// @access  Private
router.delete('/query/:queryId', protect, async (req, res) => {
  try {
    const query = await VoiceQuery.findById(req.params.queryId);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Only user who created query or admin can delete
    if (
      query.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await query.deleteOne();

    res.json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/voice/stats
// @desc    Get voice query statistics
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const stats = await VoiceQuery.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await VoiceQuery.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const languageStats = await VoiceQuery.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byCategory: categoryStats,
        byLanguage: languageStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;