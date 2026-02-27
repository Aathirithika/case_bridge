import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import lawyerRoutes from './routes/lawyers.js';
import voiceRoutes from './routes/voice.js';
import messageRoutes from './routes/messages.js';
import chatRoutes from './routes/chat.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.MONGO_URI) { console.error('MONGO_URI missing'); process.exit(1); }
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET missing'); process.exit(1); }

connectDB();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST'], credentials: true }
});

app.set('io', io);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', ollama: process.env.OLLAMA_URL || 'http://localhost:11434' }));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try { const d = jwt.verify(token, process.env.JWT_SECRET); socket.userId = d.id; socket.userRole = d.role; next(); }
  catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  console.log('connected:', socket.userId);
  socket.on('join_case', (id) => socket.join('case_' + id));
  socket.on('leave_case', (id) => socket.leave('case_' + id));
  socket.on('typing', ({ caseId, isTyping }) => socket.to('case_' + caseId).emit('user_typing', { userId: socket.userId, isTyping }));
  socket.on('disconnect', () => console.log('disconnected:', socket.userId));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log('Server on port ' + PORT));