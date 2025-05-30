import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import contestRoutes from './routes/contests.js';
import authRoutes from './routes/auth.js';
import reminderRoutes from './routes/reminders.js';
import './services/reminderService.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

app.use('/api/contests', contestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});