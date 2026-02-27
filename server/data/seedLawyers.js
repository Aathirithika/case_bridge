import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const testLawyers = [
    {
        name: 'Arjun Mehta',
        email: 'arjun@example.com',
        password: 'password123',
        role: 'lawyer',
        isVerified: true,
        verificationStatus: 'approved',
        specializations: ['Criminal Law', 'Civil Law'],
        location: 'Delhi',
        yearsOfExperience: 15,
        city: 'Delhi',
        state: 'Delhi',
        phone: '9876543210',
        profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    },
    {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'password123',
        role: 'lawyer',
        isVerified: true,
        verificationStatus: 'approved',
        specializations: ['Family Law', 'Corporate Law'],
        location: 'Mumbai',
        yearsOfExperience: 8,
        city: 'Mumbai',
        state: 'Maharashtra',
        phone: '8765432109',
        profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    },
    {
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        password: 'password123',
        role: 'lawyer',
        isVerified: true,
        verificationStatus: 'approved',
        specializations: ['Property Law', 'Criminal Law'],
        location: 'Bangalore',
        yearsOfExperience: 12,
        city: 'Bangalore',
        state: 'Karnataka',
        phone: '7654321098',
        profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    }
];

const seedLawyers = async () => {
    try {
        await connectDB();

        console.log('Clearing existing test lawyers...');
        await User.deleteMany({ email: { $in: testLawyers.map(l => l.email) } });

        console.log('Seeding test lawyers...');
        for (const lawyer of testLawyers) {
            await User.create(lawyer);
        }
        console.log(`✅ ${testLawyers.length} test lawyers seeded successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding lawyers:', error);
        process.exit(1);
    }
};

seedLawyers();
