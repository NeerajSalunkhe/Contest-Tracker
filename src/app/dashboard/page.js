'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlarmClock, CheckCircle2 } from 'lucide-react';
import { Loader2Icon } from "lucide-react"
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
export default function Dashboard() {
  const { user } = useUser();
  console.log(user);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const reminderTypes = [
    { type: '1hrBefore', label: '1 Hour Before', icon: <AlarmClock className="w-4 h-4 mr-2" /> },
    { type: '6amDayOf', label: '24 Hour Before', icon: <AlarmClock className="w-4 h-4 mr-2" /> },
  ];

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const res = await axios.post('/api/get-auto-reminder', { userid: user.id });
      setReminders(res.data.reminders || []);
    } catch {
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (type) => {
    const isSet = reminders.find((r) => r.type === type);
    const route = isSet ? 'remove-auto-reminder' : 'set-auto-reminder';
    setLoading(true);
    try {
      await axios.post(`/api/${route}`, {
        userid: user.id,
        email: user.primaryEmailAddress.emailAddress,
        type,
      });
      // toast.success(
      //   isSet ? `Removed ${type.label} reminder` : `Set ${type.label} reminder`
      // );
      fetchReminders();
    } catch {
      toast.error('Error updating reminder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReminders();
  }, [user]);

  if (!user) return null;

  return (
    <ProtectedRoute>
      <Navbar/>
      <div className='flex justify-center pt-10 h-screen items-baseline'>
        <div className="py-10 px-4 flex flex-col items-center text-black
  bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 max-w-md w-full mx-4"
        >
          {/* User Header */}
          <div className="bg-gradient-to-r from-teal-500 to-pink-500 p-1 rounded-full mb-6 shadow-lg">
            <Image
              src={user?.imageUrl}
              alt="User"
              width={100}
              height={100}
              className="rounded-full border-4 border-white"
            />
          </div>

          <h1 className="text-2xl font-bold text-black dark:text-white">{user?.fullName || 'User'}</h1>
          <p className="text-sm text-black dark:text-gray-300 mb-8">
            {user?.primaryEmailAddress.emailAddress}
          </p>

          {/* Reminder Buttons */}
          <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Set Up Auto Reminders
        </h2>

        <div className="w-full space-y-4">
          {reminderTypes.map(({ type, label, icon }) => {
            const isActive = reminders.some((r) => r.type === type);
            return (
              <Button
                key={type}
                onClick={() => toggleReminder(type)}
                disabled={loading}
                className={`w-full flex items-center justify-center cursor-pointer transition-all font-medium rounded-xl text-sm py-2 ${isActive
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                  }`}
              >
                {icon}
                {label} {isActive && <CheckCircle2 className="ml-2 w-4 h-4" />}
              </Button>
            );
          })}
        </div>
        </div>
        {/* <ToastContainer
          autoClose={1500}
          pauseOnHover
          draggable
          theme="dark"
          position="top-center"
          toastStyle={{
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        /> */}
      </div >
    </ProtectedRoute>
  );
}
