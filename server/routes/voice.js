
import express from 'express';
import VoiceQuery from '../models/VoiceQuery.js';
import { protect } from '../middleware/auth.js';
import { processMessage } from './chatEngine.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/voice/chat
// Enhanced: Now returns lawyer recommendations from database!
//
// Body: { message: string, history: [{ role, content }], language: string }
// Returns: { response, category, urgency, entities, lawyers }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    console.log('📨 Chat request:', { message, historyLength: history.length, language });

    // Process message with database integration
    const result = await processMessage(message, history, language);

    console.log('✅ Chat response:', {
      category: result.category,
      urgency: result.urgency,
      lawyersFound: result.lawyers?.length || 0
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ Error in /voice/chat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Chatbot error: ' + error.message,
      // Provide fallback response
      response: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact support if the issue persists.',
      category: 'other',
      urgency: 'normal',
      entities: { amounts: [], dates: [] },
      lawyers: []
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/voice/query – Submit a voice query for lawyer assignment
// ─────────────────────────────────────────────────────────────────────────────
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

    if (!originalQuery) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Guest users — return success without DB write
    if (req.user.role === 'guest' || req.user._id === 'guest_anonymous') {
      return res.status(201).json({
        success: true,
        message: 'Query submitted successfully (guest mode — not persisted)',
        query: {
          originalQuery,
          simplifiedQuery,
          language: language || 'en',
          category: category || 'other',
          urgency: urgency || 'normal',
          status: 'pending',
        },
      });
    }

    // Authenticated users — persist to MongoDB
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/voice/my-queries
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-queries', protect, async (req, res) => {
  try {
    if (req.user._id === 'guest_anonymous') {
      return res.json({ success: true, count: 0, queries: [] });
    }

    const queries = await VoiceQuery.find({ userId: req.user._id })
      .populate('assignedLawyer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: queries.length, queries });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/voice/pending (Lawyer / Admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pending', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const queries = await VoiceQuery.getPendingQueries();
    res.json({ success: true, count: queries.length, queries });
  } catch (error) {
    console.error('Error fetching pending queries:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/voice/assigned (Lawyer only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/assigned', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const queries = await VoiceQuery.getLawyerQueries(req.user._id);
    res.json({ success: true, count: queries.length, queries });
  } catch (error) {
    console.error('Error fetching assigned queries:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/voice/assign/:queryId (Lawyer only)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/assign/:queryId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = await VoiceQuery.findById(req.params.queryId);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    if (query.status !== 'pending') return res.status(400).json({ message: 'Query already assigned' });

    await query.assignToLawyer(req.user._id);
    res.json({ success: true, message: 'Query assigned successfully', query });
  } catch (error) {
    console.error('Error assigning query:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/voice/respond/:queryId (Lawyer only)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/respond/:queryId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { response, status } = req.body;
    const query = await VoiceQuery.findById(req.params.queryId);
    if (!query) return res.status(404).json({ message: 'Query not found' });

    if (query.assignedLawyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this query' });
    }

    query.lawyerResponse = response;
    query.status = status || 'in_progress';
    if (status === 'resolved') query.resolvedAt = new Date();
    await query.save();

    res.json({ success: true, message: 'Response submitted successfully', query });
  } catch (error) {
    console.error('Error responding to query:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/voice/query/:queryId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/query/:queryId', protect, async (req, res) => {
  try {
    const query = await VoiceQuery.findById(req.params.queryId)
      .populate('userId', 'name email phone')
      .populate('assignedLawyer', 'name email phone');

    if (!query) return res.status(404).json({ message: 'Query not found' });

    if (req.user._id === 'guest_anonymous') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (
      query.userId._id.toString() !== req.user._id.toString() &&
      (!query.assignedLawyer || query.assignedLawyer._id.toString() !== req.user._id.toString()) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, query });
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/voice/query/:queryId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/query/:queryId', protect, async (req, res) => {
  try {
    const query = await VoiceQuery.findById(req.params.queryId);
    if (!query) return res.status(404).json({ message: 'Query not found' });

    if (req.user._id === 'guest_anonymous') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (query.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await query.deleteOne();
    res.json({ success: true, message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/voice/stats (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const stats = await VoiceQuery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const categoryStats = await VoiceQuery.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const languageStats = await VoiceQuery.aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }]);

    res.json({
      success: true,
      stats: { byStatus: stats, byCategory: categoryStats, byLanguage: languageStats },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;