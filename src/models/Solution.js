import mongoose from 'mongoose';

const SolutionSchema = new mongoose.Schema({
  contestId: {
    type: Number,
    required: true,
    unique: true,
  },
  platform: {
    type: String,
    required: true,
  },
  solutionLink: {
    type: String,
    default: null,
  },
  startdate:{
    type:Date,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Solution || mongoose.model('Solution', SolutionSchema);
