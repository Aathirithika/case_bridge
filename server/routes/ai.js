import express from 'express';
import { generateLegalAdvice, extractCaseDetails } from '../services/llmService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/ai/chat
// @desc    Get an AI response to a legal query (for chatbot)
// @access  Private
router.post('/chat', protect, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const aiResponse = await generateLegalAdvice(message);

        res.json({
            success: true,
            response: aiResponse
        });
    } catch (error) {
        console.error('Error in AI Chat route:', error);
        res.status(500).json({ message: 'Error communicating with AI assistant' });
    }
});

// @route   POST /api/ai/analyze-voice
// @desc    Analyze transcribed voice text to extract case details
// @access  Private
router.post('/analyze-voice', protect, async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ message: 'Transcribed text is required' });
        }

        const details = await extractCaseDetails(text);

        res.json({
            success: true,
            details
        });
    } catch (error) {
        console.error('Error in AI Voice Analysis route:', error);
        res.status(500).json({ message: 'Error analyzing voice query' });
    }
});

export default router;
