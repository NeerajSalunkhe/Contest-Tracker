'use client';

import { useState, useEffect, useRef } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { HiOutlineX, HiOutlineBell } from 'react-icons/hi';
import ReminderModal from './ReminderModal';
import PlatformLogo from './PlatformLogo';
import ModalPortal from './ModalPortal';
import { toast, ToastContainer } from 'react-toastify';
import { useUser } from '@clerk/nextjs';
import { BellRing } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContestCard({ contest, show }) {
    const { user, isLoaded } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [progress, setProgress] = useState(0);
    const [isLive, setIsLive] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [reminders, setReminders] = useState([]);
    const [reload, setReload] = useState(false); // to trigger reload after modal changes
    const router=useRouter();

    const cardRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const openReminder = () => setShowModal(true);
    const closeReminder = () => {
        setShowModal(false);
        setReload(prev => !prev);
    };
    if (!show.includes(contest.platform) || !isLoaded) return null;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect(); // Only observe once
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) observer.observe(cardRef.current);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!visible || !user?.id || !contest?.id) return;

        const fetchBookmarkAndReminders = async () => {
            try {
                const res = await fetch('/api/bookmark-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userid: user.id,
                        contestId: contest.id
                    })
                });

                const data = await res.json();

                if (data.found) {
                    setBookmarked(data.bookmark);
                } else {
                    setBookmarked(false);
                }
            } catch (err) {
                console.error('Failed to fetch bookmark/completed status:', err);
            }

            try {
                const res = await fetch('/api/get-reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userid: user?.id,
                        contestid: contest.id
                    })
                });

                const data = await res.json();
                setReminders(data.reminders || []);
            } catch (err) {
                console.error('Failed to fetch reminders:', err);
            }
        };
        fetchBookmarkAndReminders();
    }, [visible, user?.id, contest?.id, reload]);



    const toggleBookmark = async () => {
        const newState = !bookmarked;
        setBookmarked(newState);
        newState ? toast.success('Bookmarked') : toast.warn('Removed');
        try {
            await fetch('/api/bookmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userid: user?.id,
                    email: user?.primaryEmailAddress?.emailAddress,
                    contest,
                    bookmark: newState
                })
            });
            // toast.success('Added To bookmark')
        } catch (err) {
            toast.error('Failed to sync bookmark');
            setBookmarked(!newState); // rollback on failure
        }
    };

    useEffect(() => {
        const updateCountdown = () => {
            const now = Date.now();
            const start = new Date(contest.startTime).getTime();
            const end = new Date(contest.endTime).getTime();
            const duration = end - start;

            if (now >= start && now <= end) {
                setIsLive(true);
                setTimeLeft('LIVE');
                setProgress(((now - start) / duration) * 100);
            } else if (now < start) {
                const distance = start - now;

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((distance / (1000 * 60)) % 60);
                const seconds = Math.floor((distance / 1000) % 60);

                const formattedTime = [
                    days.toString().padStart(2, '0'),
                    hours.toString().padStart(2, '0'),
                    minutes.toString().padStart(2, '0'),
                    seconds.toString().padStart(2, '0')
                ].join(':');

                setIsLive(false);
                setTimeLeft(`Starts in : ${formattedTime}`);

                const totalWait = start - (start - duration);
                const waited = now - (start - duration);
                setProgress((waited / totalWait) * 100);
            } else {
                setIsLive(false);
                setTimeLeft('Finished');
                setProgress(100);
            }
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [contest.startTime, contest.endTime]);

    if(!user) return null;
    return (
        <div ref={cardRef} className="relative z-0 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300">
            <div className="rounded-2xl border min-h-76 border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 shadow-xl flex flex-col justify-between space-y-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PlatformLogo platform={contest.platform} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {contest.platform.replace('.com', '')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {reminders.length > 0 && (
                            <BellRing className="text-yellow-500 animate-pulse w-5 h-5" />
                        )}
                        {/* Bookmark Icon */}
                        <button onClick={toggleBookmark} className="cursor-pointer text-xl">
                            {bookmarked ? (
                                <FaBookmark className="text-orange-500 transition" />
                            ) : (
                                <FaRegBookmark className="text-gray-400 hover:text-orange-400 transition" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Title & Countdown */}
                <div className="relative">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {contest.name}
                    </h2>
                    <p className="text-sm text-indigo-600 dark:text-yellow-300 font-mono">
                        {timeLeft}
                    </p>
                    {isLive && (
                        <span className="absolute top-0 right-0 text-xs px-2 py-1 bg-red-600 text-white rounded-full animate-pulse shadow-md font-bold">
                            LIVE
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(contest.startTime).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    })}{' '}
                    IST
                </span>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <a
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center cursor-pointer text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg shadow-cyan-500/50 dark:shadow-lg dark:shadow-cyan-800/80 font-medium rounded-lg text-sm px-5 py-2.5 transition"
                    >
                        Go to Contest
                    </a>
                    {!isLive && <button
                        onClick={openReminder}
                        type="button"
                        className="flex-1 text-center cursor-pointer text-black 
                            bg-gradient-to-r from-orange-200 via-orange-300 to-yellow-300 
                            hover:bg-gradient-to-br focus:ring-4 focus:outline-none 
                            focus:ring-yellow-200 dark:focus:ring-yellow-700 
                            shadow-lg shadow-orange-300/50 dark:shadow-lg dark:shadow-yellow-800/70 
                            font-medium rounded-lg text-sm px-5 py-2.5 transition"
                    >
                        Set Reminder
                    </button>}
                </div>


            </div>

            {/* Reminder Modal */}
            {showModal && (
                <ModalPortal>
                    <ReminderModal
                        userid={user?.id}
                        email={user?.primaryEmailAddress?.emailAddress}
                        contest={contest}
                        onClose={closeReminder}
                        reminders={reminders} // Pass it here
                    />
                </ModalPortal>
            )}
        </div>
    );
}
