import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Case from '../models/Case.js';
import connectDB from '../config/db.js';

dotenv.config();

const clearData = async () => {
    try {
        await connectDB();

        console.log('Clearing existing cases...');
        await Case.deleteMany({});
        console.log('Cases cleared.');

        console.log('Clearing client and lawyer data...');
        // We delete users with roles 'client' or 'lawyer'
        const result = await User.deleteMany({ role: { $in: ['client', 'lawyer'] } });
        console.log(`${result.deletedCount} users (clients/lawyers) deleted.`);

        console.log('Database cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
