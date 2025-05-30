import express from 'express';
import Contest from '../models/Contest.js';
import { updateContests } from '../services/contestFetcher.js';
import { fetchSolutionVideos } from '../services/youtubeService.js';
import { authenticateToken } from '../middleware/auth.js';
import cron from 'node-cron';

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Schedule contest updates every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled contest update');
  await updateContests();
  await fetchSolutionVideos();
});

// Get all contests with filtering
router.get('/', async (req, res) => {
  try {
    const { platforms, showPast, showUpcoming, bookmarked } = req.query;
    const query = {};

    // Platform filter
    if (platforms) {
      query.platform = { $in: platforms.split(',') };
    }

    // Time filter
    const now = new Date();
    if (showPast === 'true' && showUpcoming === 'false') {
      query.endTime = { $lt: now };
    } else if (showPast === 'false' && showUpcoming === 'true') {
      query.startTime = { $gt: now };
    }

    // Bookmark filter
    if (bookmarked === 'true') {
      query.bookmarkedBy = req.user.userId;
    }

    const contests = await Contest.find(query).sort({ startTime: 1 });
    
    // Add isBookmarked flag for the current user
    const contestsWithBookmarkStatus = contests.map(contest => ({
      ...contest.toObject(),
      isBookmarked: contest.bookmarkedBy.includes(req.user.userId)
    }));

    res.json(contestsWithBookmarkStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle bookmark
router.patch('/:id/bookmark', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const userIndex = contest.bookmarkedBy.indexOf(req.user.userId);
    if (userIndex === -1) {
      contest.bookmarkedBy.push(req.user.userId);
    } else {
      contest.bookmarkedBy.splice(userIndex, 1);
    }

    await contest.save();
    res.json({
      ...contest.toObject(),
      isBookmarked: contest.bookmarkedBy.includes(req.user.userId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update solution URL manually
router.patch('/:id/solution', async (req, res) => {
  try {
    const { solutionUrl } = req.body;
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { solutionUrl },
      { new: true }
    );
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    res.json(contest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Force update contests
router.post('/update', async (req, res) => {
  try {
    await updateContests();
    await fetchSolutionVideos();
    res.json({ message: 'Contests updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;