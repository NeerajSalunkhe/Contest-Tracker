import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  timing: {
    type: Number, // minutes before contest
    required: true
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\+[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    required: function() { return this.type === 'sms'; }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Reminder', reminderSchema);