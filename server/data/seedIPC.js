import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IPCSection from '../models/IPCSection.js';
import connectDB from '../config/db.js';

dotenv.config();

const ipcSections = [
    {
        sectionNumber: '302',
        title: 'Punishment for murder',
        description: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
        punishment: 'Death or Imprisonment for life, and fine',
        category: 'Criminal'
    },
    {
        sectionNumber: '307',
        title: 'Attempt to murder',
        description: 'Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder, shall be punished with imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine; and if hurt is caused to any person by such act, the offender shall be liable either to imprisonment for life, or to such punishment as is hereinbefore mentioned.',
        punishment: 'Imprisonment for 10 years and fine, if hurt is caused, imprisonment for life',
        category: 'Criminal'
    },
    {
        sectionNumber: '375',
        title: 'Rape',
        description: 'A man is said to commit "rape" who, except in the case which is provided for in section 376, has sexual intercourse with a woman under circumstances falling under any of the seven descriptions provided in the section.',
        punishment: 'Rigorous imprisonment for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine.',
        category: 'Criminal'
    },
    {
        sectionNumber: '376',
        title: 'Punishment for rape',
        description: 'Whoever, except in the cases provided for by sub-section (2), commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine.',
        punishment: 'Rigorous imprisonment for not less than 10 years, extending to life, and fine.',
        category: 'Criminal'
    },
    {
        sectionNumber: '378',
        title: 'Theft',
        description: 'Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person\'s consent, moves that property in order to such taking, is said to commit theft.',
        punishment: 'Imprisonment for 3 years, or fine, or both.',
        category: 'Criminal'
    },
    {
        sectionNumber: '420',
        title: 'Cheating and dishonestly inducing delivery of property',
        description: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
        punishment: 'Imprisonment for 7 years and fine.',
        category: 'Criminal'
    },
    {
        sectionNumber: '498A',
        title: 'Husband or relative of husband of a woman subjecting her to cruelty',
        description: 'Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine.',
        punishment: 'Imprisonment for 3 years and fine.',
        category: 'Family'
    },
    {
        sectionNumber: '506',
        title: 'Punishment for criminal intimidation',
        description: 'Whoever commits the offence of criminal intimidation shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.',
        punishment: 'Imprisonment for 2 years, or fine, or both.',
        category: 'Criminal'
    }
];

const seedIPC = async () => {
    try {
        await connectDB();

        console.log('Clearing existing IPC sections...');
        await IPCSection.deleteMany({});
        console.log('Existing IPC sections cleared.');

        console.log('Seeding new IPC sections...');
        const createdSections = await IPCSection.insertMany(ipcSections);
        console.log(`✅ ${createdSections.length} IPC sections seeded successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding IPC data:', error);
        process.exit(1);
    }
};

seedIPC();
