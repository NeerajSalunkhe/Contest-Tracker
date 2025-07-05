'use client';

import { useEffect, useRef, useState } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import PlatformLogo from './PlatformLogo';
import { toast } from 'react-toastify';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { set } from 'mongoose';


function getISTTime(dateString) {
  const date = new Date(new Date(dateString).getTime() - (5.5 * 60 * 60 * 1000));
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
export default function FinishedContestCard({ contest, show }) {
  const { user, isLoaded } = useUser();
  const cardRef = useRef(null);
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [solutionLink, setSolutionLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ul, setUl] = useState('/');
  const [uu, setUU] = useState(contest.url);
  // Exit early if not loaded or platform filter mismatch
  if (!show.includes(contest.platform) || !isLoaded) return null;
  // console.log(contest.url);
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
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !user?.id || !contest?.id) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/bookmark-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid: user.id,
            contestId: contest.id,
          }),
        });

        const data = await res.json();
        if (data.found) {
          setBookmarked(data.bookmark);
          setChecked(data.completed);
        }
      } catch (err) {
        console.error('Failed to fetch bookmark/completed status:', err);
      }
    };

    fetchStatus();
  }, [visible, user?.id, contest?.id]);

  useEffect(() => {
    if (!visible) return;

    const fetchSolutionLink = async () => {
      try {
        const res = await fetch('/api/getSolutionLink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contest }),
        });

        const data = await res.json();
        if (res.ok && data.found) {
          setSolutionLink(data.url);
        }
      } catch (err) {
        console.error('Error fetching solution:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutionLink();
  }, [visible, contest]);

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
          bookmark: newState,
        }),
      });
    } catch (err) {
      toast.error('Failed to sync bookmark');
      setBookmarked(!newState);
    }
  };

  const toggleCheckbox = async () => {
    const newState = !checked;
    setChecked(newState);
    newState ? toast.success('Marked as Completed') : toast.warn('Removed from Completed');

    try {
      await fetch('/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          contest,
          completed: newState,
        }),
      });
    } catch (err) {
      toast.error('Failed to sync status');
      setChecked(!newState);
    }
  };
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
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <PlatformLogo platform={contest.platform} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {contest.platform.replace('.com', '')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Completed Checkbox */}
            <label className="cursor-pointer relative w-5 h-5">
              <input
                type="checkbox"
                checked={checked}
                onChange={toggleCheckbox}
                className="peer appearance-none w-full h-full rounded-md border-2 border-gray-400 checked:bg-green-500 checked:border-green-600 focus:ring-2 focus:ring-green-400 transition"
              />
              <svg
                className="absolute inset-0 w-full h-full p-0.5 text-white opacity-0 peer-checked:opacity-100 transition"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </label>
            {/* Bookmark Button */}
            <button onClick={toggleBookmark} className="cursor-pointer text-xl" title="Toggle bookmark">
              {bookmarked ? (
                <FaBookmark className="text-orange-500 transition" />
              ) : (
                <FaRegBookmark className="text-gray-400 hover:text-orange-400 transition" />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 leading-snug">
          {contest.name}
        </h2>
        <div className='flex justify-between items-center'>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getISTTime(contest.startTime)} IST
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
                Standings
              </button>
            </Link>
          </div>
        </div>


        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center cursor-pointer text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg font-medium rounded-lg text-sm px-5 py-2.5 transition"
          >
            Go to Contest
          </a>

          <a
            href={solutionLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 text-center font-medium rounded-lg text-sm px-5 py-2.5 transition ${solutionLink
              ? 'cursor-pointer text-white bg-gradient-to-r from-teal-400 to-lime-500 hover:from-teal-500 hover:to-lime-600 focus:ring-4 focus:outline-none focus:ring-lime-300 dark:focus:ring-lime-800 shadow-md'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            onClick={(e) => {
              if (!solutionLink) e.preventDefault();
            }}
          >
            {loading ? 'Checking...' : solutionLink ? 'Watch Solution' : 'No Solution'}
          </a>
        </div>
      </div>
    </div>
  );
}


