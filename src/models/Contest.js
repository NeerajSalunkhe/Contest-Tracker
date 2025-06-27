import mongoose from 'mongoose';

const ContestSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  email:{ type: String, required: true},
  contests: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      platform: { type: String, required: true },
      url: { type: String, required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true },
      durationSeconds: { type: Number, required: true },
      bookmark: { type: Boolean, default: false },
      reminders: [
        {
          time: { type: Date, required: true },
          sent:{type:Boolean,default:false},
        }
      ],
      completed: { type: Boolean, default: false },
    }
  ]
}, { timestamps: true });

export default mongoose.models.Contest || mongoose.model('Contest', ContestSchema);
