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
import Link from 'next/link';



export default function ContestCard({ contest, show }) {
    const { user, isLoaded } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [progress, setProgress] = useState(0);
    const [isLive, setIsLive] = useState(false);
    const [isfinish, setFinish] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [reminders, setReminders] = useState([]);
    const [reload, setReload] = useState(false); // to trigger reload after modal changes
    const router = useRouter();
    const [ul, setUl] = useState('/');
    const [uu, setUU] = useState(contest.url);
    const cardRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const openReminder = () => setShowModal(true);
    const closeReminder = () => {
        setShowModal(false);
        setReload(prev => !prev);
    };
    if (!show.includes(contest.platform) || !isLoaded) return null;


    useEffect(() => {
        setUU(contest.url);
    }, [contest]);
    // Intersection Observer
    useEffect(() => {
        if (contest.platform === 'codeforces.com') {
            // Convert: https://codeforces.com/contests/2119/ → https://codeforces.com/contest/2119/
            const correctedUU = uu.replace('/contests/', '/contest/');
            setUl(`${correctedUU}/standings/friends/true`);
        } else if (contest.platform === 'leetcode.com') {
            setUl(`${uu}/ranking/?region=global_v2`);
        } else {
            // Convert: https://www.codechef.com/START193B → https://www.codechef.com/ranking/START193B
            const correctedUU = uu.replace('codechef.com/', 'codechef.com/rankings/');
            setUl(`${correctedUU}B?itemsPerPage=100&order=asc&page=1&sortBy=rank`);
        }
    }, [contest]);
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
            const nowIST = new Date().getTime();
            const startIST = getISTDateObject(contest.startTime).getTime();
            const endIST = getISTDateObject(contest.endTime).getTime();
            const duration = endIST - startIST;

            if (nowIST >= startIST && nowIST <= endIST) {
                setIsLive(true);
                setTimeLeft('LIVE');
                setProgress(((nowIST - startIST) / duration) * 100);
            } else if (nowIST < startIST) {
                const distance = startIST - nowIST;

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((distance / (1000 * 60)) % 60);
                const seconds = Math.floor((distance / 1000) % 60);

                const formattedTime = [
                    days.toString().padStart(2, '0'),
                    hours.toString().padStart(2, '0'),
                    minutes.toString().padStart(2, '0'),
                    seconds.toString().padStart(2, '0'),
                ].join(':');

                setIsLive(false);
                setTimeLeft(`Starts in : ${formattedTime}`);

                // Progress from 1 week before start time
                const oneWeekBeforeStart = startIST - 7 * 24 * 60 * 60 * 1000; // 1 week in ms
                const totalCountdownRange = startIST - oneWeekBeforeStart;
                const timeElapsed = nowIST - oneWeekBeforeStart;

                const percentProgress = (timeElapsed / totalCountdownRange) * 100;

                setProgress(Math.max(0, Math.min(100, percentProgress)));
            } else {
                setFinish(true);
                setIsLive(false);
                setTimeLeft('Finished');
                setProgress(100);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [contest.startTime, contest.endTime]);



    if (!user) return null;
    return (
        <div
            ref={cardRef}
            className="relative z-0 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300 glass-refract-border"
        >
            <div className="absolute inset-0 rounded-2xl pointer-events-none z-10">
                <div className="w-full h-full rounded-2xl blur-[6px] opacity-80 bg-gradient-to-br from-white/10 via-white/10 to-transparent border border-white/20 group-hover:opacity-100 transition duration-300" />
            </div>

            <div className="rounded-2xl border min-h-81 border-gray-300 dark:border-gray-700 bg-white/5 dark:bg-gray-900/60 backdrop-blur-md p-6 shadow-xl flex flex-col justify-between space-y-4 overflow-hidden">

                {/* ...rest of your content */}

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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 overflow-y-auto max-h-14">
                        {contest.name}
                    </h2>
                    <div className='flex justify-between items-center'>
                        <p className="text-sm text-indigo-600 dark:text-yellow-300 font-mono">
                            {timeLeft}
                        </p>
                        {isLive && (
                            <div>
                                <span className="absolute top-0 right-0 text-xs px-2 py-1 bg-red-600 text-white rounded-full animate-pulse shadow-md font-bold">
                                    LIVE
                                </span>
                                <div>
                                    <Link
                                        href={ul}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <button
                                            type="button"
                                            className="flex-1 text-center cursor-pointer text-white bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg font-medium rounded-lg text-sm px-5 py-2.5 transition"
                                        >
                                            Live Standings
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        )}
                        {isfinish && (
                            <div>
                                <Link
                                    href={ul}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <button
                                        type="button"
                                        className="flex-1 text-center cursor-pointer text-white bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg font-medium rounded-lg text-sm px-5 py-2.5 transition"
                                    >
                                        Standings
                                    </button>   
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getISTTime(contest.startTime)} IST
                </span>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                    {isLive ? (
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-yellow-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    ) : (
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-600 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    )}
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
function getISTTime(dateString) {
    const date = new Date(new Date(dateString).getTime() - (5.5 * 60 * 60 * 1000));
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function getISTDateObject(dateString) {
    return new Date(new Date(dateString).getTime() - (5.5 * 60 * 60 * 1000));
}

