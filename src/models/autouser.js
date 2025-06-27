import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  type: { type: String, enum: ['1hrBefore', '6amDayOf'], required: true },
  sent: { type: Boolean, default: false },
});

const autoUserSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  reminders: [reminderSchema],
});

export default mongoose.models.AutoUser || mongoose.model('AutoUser', autoUserSchema);
