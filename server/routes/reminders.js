import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Get user's reminders
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.userId })
      .populate('contestId')
      .sort({ createdAt: -1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new reminder
router.post('/', async (req, res) => {
  try {
    const { contestId, type, timing, phone } = req.body;

    // Validate phone number if SMS reminder
    if (type === 'sms' && !phone) {
      return res.status(400).json({ message: 'Phone number required for SMS reminders' });
    }

    const reminder = new Reminder({
      userId: req.user.userId,
      contestId,
      type,
      timing,
      phone
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update reminder
router.patch('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      reminder[key] = updates[key];
    });

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;