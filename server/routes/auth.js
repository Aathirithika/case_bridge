import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { barCouncilDataset } from '../data/barCouncilData.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/register
// @desc    Register new user (client)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'client',
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/verify-bar-council
// @desc    Verify bar council number against dataset
// @access  Public
router.post('/verify-bar-council', async (req, res) => {
    try {
        const { barCouncilNumber } = req.body;

        if (!barCouncilNumber) {
            return res.status(400).json({ message: 'Bar Council Number is required' });
        }

        // Verify Bar Council Number in dataset
        const barCouncilRecord = barCouncilDataset.find(
            record => record.barCouncilNumber.toUpperCase() === barCouncilNumber.toUpperCase()
        );

        if (!barCouncilRecord) {
            return res.status(404).json({
                isValid: false,
                message: 'Invalid Bar Council Number'
            });
        }

        // Check if already registered
        const existingUser = await User.findOne({ barCouncilNumber: barCouncilNumber.toUpperCase() });
        if (existingUser) {
            return res.status(409).json({
                isValid: false,
                message: 'This Bar Council Number is already registered'
            });
        }

        // Check if active
        if (barCouncilRecord.status !== 'active') {
            return res.status(400).json({
                isValid: false,
                message: 'Bar Council Number is not active'
            });
        }

        // Return success with lawyer details
        res.json({
            isValid: true,
            message: 'Bar Council Number verified successfully',
            lawyerData: {
                name: barCouncilRecord.lawyerName,
                state: barCouncilRecord.state,
                enrollmentDate: barCouncilRecord.enrollmentDate
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during verification' });
    }
});

// @route   POST /api/auth/register-lawyer
// @desc    Register new lawyer with Bar Council verification
// @access  Public
router.post('/register-lawyer', async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            phone,
            barCouncilNumber,
            yearsOfExperience,
            location,
            specializations
        } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Verify Bar Council Number in dataset
        const barCouncilRecord = barCouncilDataset.find(
            record => record.barCouncilNumber.toUpperCase() === barCouncilNumber.toUpperCase()
        );

        if (!barCouncilRecord) {
            return res.status(400).json({
                message: 'Invalid Bar Council Number. Please check and try again.',
                field: 'barCouncilNumber'
            });
        }

        // Check if Bar Council number is already registered
        const barNumberExists = await User.findOne({ barCouncilNumber: barCouncilNumber.toUpperCase() });
        if (barNumberExists) {
            return res.status(400).json({
                message: 'This Bar Council Number is already registered',
                field: 'barCouncilNumber'
            });
        }

        // Check if the status is active
        if (barCouncilRecord.status !== 'active') {
            return res.status(400).json({
                message: 'This Bar Council Number is not active. Please contact Bar Council.',
                field: 'barCouncilNumber'
            });
        }

        // Create lawyer user with verified status
        const user = await User.create({
            name: fullName,
            email,
            password,
            phone,
            role: 'lawyer',
            barCouncilNumber: barCouncilNumber.toUpperCase(),
            yearsOfExperience,
            location,
            specializations,
            isVerified: true,
            verificationStatus: 'approved',
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                barCouncilNumber: user.barCouncilNumber,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus,
                token: generateToken(user._id),
                message: 'Registration successful! Bar Council Number verified.'
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check if lawyer is verified
            if (user.role === 'lawyer' && user.verificationStatus !== 'approved') {
                return res.status(403).json({
                    message: 'Your account is pending verification. Please wait for approval.',
                    verificationStatus: user.verificationStatus
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    res.json(req.user);
});

export default router;