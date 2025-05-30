import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Contest } from '../types';

interface ReminderModalProps {
  contest: Contest;
  onClose: () => void;
  onSuccess: () => void;
}

const REMINDER_TIMES = [
  { value: 60, label: '1 hour' },
  { value: 30, label: '30 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 5, label: '5 minutes' }
];

const ReminderModal: React.FC<ReminderModalProps> = ({ contest, onClose, onSuccess }) => {
  const [reminderType, setReminderType] = useState<'email' | 'sms'>('email');
  const [timing, setTiming] = useState(30);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/reminders`, {
        contestId: contest._id,
        type: reminderType,
        timing,
        phone: reminderType === 'sms' ? phone : undefined
      });

      onSuccess();
      onClose();
    } catch (error) {
      setError('Failed to set reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Set Reminder for {contest.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reminder Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={reminderType === 'email'}
                  onChange={(e) => setReminderType(e.target.value as 'email' | 'sms')}
                  className="mr-2"
                />
                Email
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sms"
                  checked={reminderType === 'sms'}
                  onChange={(e) => setReminderType(e.target.value as 'email' | 'sms')}
                  className="mr-2"
                />
                SMS
              </label>
            </div>
          </div>

          {reminderType === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Remind me before
            </label>
            <select
              value={timing}
              onChange={(e) => setTiming(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {REMINDER_TIMES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting reminder...' : 'Set Reminder'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;