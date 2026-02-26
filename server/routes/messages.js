import express from 'express';
import Message from '../models/Message.js';
import Case from '../models/Case.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/case/:caseId
// @desc    Get all messages for a specific case
// @access  Private (Client or Lawyer assigned to the case)
router.get('/case/:caseId', protect, async (req, res) => {
    try {
        const { caseId } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        // Verify user has access to this case
        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const isClient = caseData.client.toString() === req.user._id.toString();
        const isLawyer = caseData.lawyer && caseData.lawyer.toString() === req.user._id.toString();

        if (!isClient && !isLawyer) {
            return res.status(403).json({ message: 'Access denied to this case' });
        }

        // Fetch messages
        const messages = await Message.find({ case: caseId })
            .populate('sender', 'name email role')
            .populate('receiver', 'name email role')
            .sort({ createdAt: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { caseId, receiverId, content, messageType, fileName, fileUrl, fileSize } = req.body;

        // Verify case exists and user has access
        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const isClient = caseData.client.toString() === req.user._id.toString();
        const isLawyer = caseData.lawyer && caseData.lawyer.toString() === req.user._id.toString();

        if (!isClient && !isLawyer) {
            return res.status(403).json({ message: 'Access denied to this case' });
        }

        // Create message
        const newMessage = await Message.create({
            case: caseId,
            sender: req.user._id,
            receiver: receiverId,
            messageType: messageType || 'text',
            content,
            fileName,
            fileUrl,
            fileSize
        });

        // Populate sender and receiver details
        await newMessage.populate('sender', 'name email role');
        await newMessage.populate('receiver', 'name email role');

        // Emit socket event (handled by socket.io in server.js)
        const io = req.app.get('io');
        if (io) {
            io.to(`case_${caseId}`).emit('new_message', newMessage);
        }

        res.status(201).json({
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only receiver can mark as read
        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        message.readStatus = true;
        message.readAt = new Date();
        await message.save();

        // Emit socket event for read receipt
        const io = req.app.get('io');
        if (io) {
            io.to(`case_${message.case}`).emit('message_read', {
                messageId: message._id,
                readAt: message.readAt
            });
        }

        res.json({
            message: 'Message marked as read',
            data: message
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/messages/unread
// @desc    Get unread message count per case
// @access  Private
router.get('/unread', protect, async (req, res) => {
    try {
        // Get all cases for the user
        const filter = {};
        if (req.user.role === 'lawyer') {
            filter.lawyer = req.user._id;
        } else if (req.user.role === 'client') {
            filter.client = req.user._id;
        }

        const cases = await Case.find(filter).select('_id');
        const caseIds = cases.map(c => c._id);

        // Count unread messages for each case
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    case: { $in: caseIds },
                    receiver: req.user._id,
                    readStatus: false
                }
            },
            {
                $group: {
                    _id: '$case',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format response
        const result = unreadCounts.map(item => ({
            caseId: item._id,
            unreadCount: item.count
        }));

        res.json({ unreadCounts: result });
    } catch (error) {
        console.error('Error fetching unread counts:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
