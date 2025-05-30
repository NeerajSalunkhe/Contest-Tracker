import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    enum: ['codeforces', 'codechef', 'leetcode'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  solutionUrl: {
    type: String,
  },
});

export default mongoose.model('Contest', contestSchema);