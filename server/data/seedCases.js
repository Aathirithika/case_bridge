// Sample data seeder for testing the case management system
// Run this file to populate the database with sample cases

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from '../models/Case.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedCases = async () => {
    try {
        await connectDB();

        // Find a lawyer and client in the database
        const lawyer = await User.findOne({ role: 'lawyer' });
        const client = await User.findOne({ role: 'client' });

        if (!lawyer) {
            console.log('No lawyer found. Please register a lawyer first.');
            process.exit(1);
        }

        if (!client) {
            console.log('No client found. Creating sample client...');
            // Create a sample client if none exists
            const sampleClient = await User.create({
                name: 'John Doe',
                email: 'client@example.com',
                password: 'password123',
                role: 'client',
            });
            console.log('Sample client created:', sampleClient.email);
        }

        const actualClient = client || await User.findOne({ role: 'client' });

        // Clear existing cases (optional - uncomment if you want to reset)
        // await Case.deleteMany({});

        // Sample cases data
        const sampleCases = [
            {
                caseType: 'Family Law',
                title: 'Divorce Settlement Case',
                description: 'Client seeking mutual divorce settlement with property division.',
                client: actualClient._id,
                lawyer: lawyer._id,
                status: 'in_progress',
                priority: 'high',
                remarks: [{
                    text: 'Initial consultation completed. Proceeding with documentation.',
                    addedBy: lawyer._id,
                }],
            },
            {
                caseType: 'Property Law',
                title: 'Property Dispute Resolution',
                description: 'Dispute over property ownership between two parties.',
                client: actualClient._id,
                lawyer: lawyer._id,
                status: 'under_review',
                priority: 'medium',
                remarks: [{
                    text: 'Documents received. Under review.',
                    addedBy: lawyer._id,
                }],
            },
            {
                caseType: 'Corporate Law',
                title: 'Business Contract Review',
                description: 'Review and advisory for business partnership agreement.',
                client: actualClient._id,
                lawyer: lawyer._id,
                status: 'in_progress',
                priority: 'low',
            },
            {
                caseType: 'Criminal Law',
                title: 'Bail Application',
                description: 'Bail application for wrongful detention case.',
                client: actualClient._id,
                lawyer: lawyer._id,
                status: 'closed',
                priority: 'high',
                remarks: [{
                    text: 'Bail granted successfully. Case closed.',
                    addedBy: lawyer._id,
                }],
            },
            {
                caseType: 'Civil Law',
                title: 'Consumer Complaint',
                description: 'Consumer court case for defective product compensation.',
                client: actualClient._id,
                lawyer: lawyer._id,
                status: 'submitted',
                priority: 'medium',
            },
        ];

        // Create cases
        const createdCases = await Case.insertMany(sampleCases);
        console.log(`✅ ${createdCases.length} sample cases created successfully!`);
        console.log('\nSample Cases:');
        createdCases.forEach(c => {
            console.log(`- ${c.caseNumber}: ${c.title} (${c.status})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedCases();
