import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if user already exists
        const existing = await User.findOne({ email: 'aathirithikas@gmail.com' });

        if (existing) {
            // Promote existing user to admin
            existing.role = 'admin';
            await existing.save();
            console.log('Existing user promoted to admin:', existing.name);
        } else {
            // Create new admin user
            const admin = await User.create({
                name: 'Aathirithika S',
                email: 'aathirithikas@gmail.com',
                password: 'case@246',
                role: 'admin',
                isVerified: true,
                verificationStatus: 'approved'
            });
            console.log('Admin user created:', admin.name);
        }

        await mongoose.connection.close();
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

seedAdmin();
