'use client';

import { useEffect, useState } from 'react';
import { HiOutlineX, HiOutlineBell, HiCheckCircle } from 'react-icons/hi';
import { FaRegClock, FaRegCalendarAlt, FaHourglassHalf } from 'react-icons/fa';
import PlatformLogo from './PlatformLogo';
import { toast, ToastContainer } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react"
const reminderOptions = [
  { label: '30 minutes before', offset: 30 * 60 * 1000 },
  { label: '1 hour before', offset: 60 * 60 * 1000 },
  { label: '24 hours before', offset: 24 * 60 * 60 * 1000 },
];

function parseISTTime(datetime) {
  return new Date(
    new Date(datetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
}

export default function ReminderModal({ userid, email, contest, onClose, reminders = [] }) {
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [localReminders, setLocalReminders] = useState(reminders || []);

  useEffect(() => {
    setScrollY(window.scrollY || document.documentElement.scrollTop);
    setViewportHeight(window.innerHeight);
  }, []);

  const modalTop = scrollY + viewportHeight / 2 - 200;
  const startDate = new Date(contest.startTime);
  const endDate = new Date(contest.endTime);
  const platformName = contest.platform.replace('.com', '');

  const formatTime = (datetime) => {
    const istDate = new Date(new Date(datetime).getTime() - (5.5 * 60 * 60 * 1000));
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short',
    });
    return formatter.format(istDate);
  };

  const getReminderTimestamp = (type) => {
    return new Date(startDate.getTime() - type.offset).getTime();
  };

  const activeReminderTimes = localReminders.map((r) => new Date(r.time).getTime());

  const handleToggleReminder = async (type, index) => {
    const targetTime = getReminderTimestamp(type);
    const isSet = activeReminderTimes.includes(targetTime);

    setLoadingIndex(index);

    if (isSet) {
      // Unset reminder
      try {
        const res = await fetch('/api/remove-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid,
            contestid: contest.id,
            reminderTime: new Date(targetTime).toISOString(),
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setLocalReminders((prev) =>
            prev.filter((r) => new Date(r.time).getTime() !== targetTime)
          );
          toast.warn('Reminder removed');
        } else {
          toast.error(data.message || 'Failed to remove reminder');
        }
      } catch (err) {
        toast.error('Error removing reminder');
      } finally {
        setLoadingIndex(null);
      }
    } else {
      // Set reminder
      const reminderTime = new Date(targetTime);
      try {
        const res = await fetch('/api/set-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid,
            email,
            contestid: contest.id,
            reminderTime,
            contest,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setLocalReminders((prev) => [...prev, { time: reminderTime }]);
          toast.success('Reminder set!');
        } else {
          toast.error(data.message || 'Failed to set reminder');
        }
      } catch (err) {
        toast.error('Error setting reminder');
      } finally {
        setLoadingIndex(null);
      }
    }
  };


  return (
    <>
      {/* <ToastContainer
        autoClose={2000}
        pauseOnHover
        draggable
        hideProgressBar={false}
        newestOnTop
        limit={3}
        theme="dark"
        position="top-right"
        toastStyle={{
          background: '#111',
          color: '#fff',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '0.9rem',
        }}
        className="overflow-x-clip"
      /> */}

      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xs" />

      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-[1000] px-4 w-full"
        style={{ top: `${modalTop}px` }}
      >
        <div
          className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 shadow-2xl rounded-2xl p-6 pointer-events-auto backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl transition cursor-pointer"
          >
            <HiOutlineX />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <PlatformLogo platform={contest.platform} size={28} />
            <h2 className="text-lg font-bold">{platformName} — Set Reminder</h2>
          </div>

          <div className="space-y-2 bg-white/60 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-sm font-medium mb-4">
            <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FaRegCalendarAlt /> {contest.name}
            </p>
            <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FaRegClock /> Start: {formatTime(startDate)} IST
            </p>
            <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FaRegClock /> End: {formatTime(endDate)} IST
            </p>
            <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FaHourglassHalf /> Duration:{' '}
              {Math.floor(contest.durationSeconds / 3600)}h{' '}
              {(contest.durationSeconds / 60) % 60}m
            </p>
          </div>

          <div className="space-y-3">
            {reminderOptions.map((type, i) => {
              const isSet = activeReminderTimes.includes(getReminderTimestamp(type));
              return (
                <Button
                  key={i}
                  onClick={() => handleToggleReminder(type, i)}
                  disabled={loadingIndex !== null}
                  isLoading={loadingIndex === i}

                  className={`cursor-pointer w-full flex items-center justify-center gap-2 text-sm px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg ${isSet
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:from-red-500 hover:via-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-orange-400 via-yellow-400 to-yellow-500 text-black hover:from-orange-500 hover:via-yellow-500 hover:to-yellow-600'
                    }`}
                >
                  {isSet ? (
                    <HiCheckCircle className="text-white text-lg" />
                  ) : (
                    <HiOutlineBell className="text-black text-lg" />
                  )}
                  {isSet
                    ? `Reminder set: ${type.label} (Click to unset)`
                    : `Set Reminder: ${type.label}`}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
