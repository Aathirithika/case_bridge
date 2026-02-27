import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BarCouncil from '../models/BarCouncil.js';
import { barCouncilDataset } from './barCouncilData.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedBarCouncil = async () => {
    try {
        await connectDB();

        // Clear existing data as requested
        console.log('Clearing existing Bar Council data...');
        await BarCouncil.deleteMany({});
        console.log('Existing data cleared.');

        // Insert new data
        console.log('Seeding new Bar Council data...');
        const createdData = await BarCouncil.insertMany(barCouncilDataset);
        console.log(`✅ ${createdData.length} Bar Council records seeded successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding Bar Council data:', error);
        process.exit(1);
    }
};

seedBarCouncil();
