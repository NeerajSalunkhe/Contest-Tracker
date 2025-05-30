import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, formatDistance, format, differenceInSeconds } from 'date-fns';
import { BookmarkPlus, BookmarkCheck, Youtube, ExternalLink, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Contest, Filter } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import ReminderModal from './ReminderModal';

const ContestList: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [filter, setFilter] = useState<Filter>({
    platforms: ['codeforces', 'codechef', 'leetcode'],
    showPastContests: true,
    showUpcomingContests: true,
    showBookmarkedOnly: false
  });
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchContests();
  }, [filter]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const newTimeLeft: { [key: string]: string } = {};

      contests.forEach(contest => {
        const startTime = new Date(contest.startTime);
        if (startTime > now) {
          const seconds = differenceInSeconds(startTime, now);
          const days = Math.floor(seconds / 86400);
          const hours = Math.floor((seconds % 86400) / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const remainingSeconds = seconds % 60;

          newTimeLeft[contest._id] = `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
        }
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [contests]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        platforms: filter.platforms.join(','),
        showPast: filter.showPastContests.toString(),
        showUpcoming: filter.showUpcomingContests.toString(),
        bookmarked: filter.showBookmarkedOnly.toString()
      });

      const response = await axios.get(`${API_BASE_URL}/api/contests?${params}`);
      const sortedContests = (Array.isArray(response.data) ? response.data : [])
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setContests(sortedContests);
    } catch (error) {
      console.error('Error fetching contests:', error);
      setError('Failed to fetch contests. Please try again later.');
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (id: string) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/contests/${id}/bookmark`);
      if (response.data) {
        setContests(prevContests => 
          prevContests.map(contest => 
            contest._id === id ? { ...contest, isBookmarked: !contest.isBookmarked } : contest
          )
        );
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const filteredContests = contests.filter(contest => 
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = new Date();
  const upcomingContests = filteredContests.filter(contest => new Date(contest.startTime) > now);
  const pastContests = filteredContests.filter(contest => new Date(contest.startTime) <= now);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading contests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  const renderContestList = (contests: Contest[], title: string) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <motion.div
            key={contest._id}
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {contest.name}
                </h3>
                <div className="flex gap-2">
                  {new Date(contest.startTime) > now && (
                    <button
                      onClick={() => setSelectedContest(contest)}
                      className="text-primary-500 hover:text-primary-600"
                      title="Set reminder"
                    >
                      <Bell className="w-6 h-6" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleBookmark(contest._id)}
                    className="text-primary-500 hover:text-primary-600"
                  >
                    {contest.isBookmarked ? (
                      <BookmarkCheck className="w-6 h-6" />
                    ) : (
                      <BookmarkPlus className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Platform: {contest.platform}</p>
                <p>Starts: {format(new Date(contest.startTime), 'PPP pp')}</p>
                {timeLeft[contest._id] ? (
                  <p className="text-primary-600 dark:text-primary-400 font-semibold">
                    Time left: {timeLeft[contest._id]}
                  </p>
                ) : (
                  <p>
                    {new Date(contest.startTime) > now
                      ? `Starts ${formatDistanceToNow(new Date(contest.startTime))} from now`
                      : `Started ${formatDistanceToNow(new Date(contest.startTime))} ago`}
                  </p>
                )}
                <p>Duration: {
                  formatDistance(new Date(contest.startTime), new Date(contest.endTime))
                }</p>
              </div>

              <div className="mt-4 flex gap-2">
                <a
                  href={contest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Contest Page
                </a>
                {contest.solutionUrl && (
                  <a
                    href={contest.solutionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                    Solution
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Filters</h2>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search contests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <div className="flex flex-wrap gap-4">
          {['codeforces', 'codechef', 'leetcode'].map(platform => (
            <button
              key={`filter-${platform}`}
              onClick={() => setFilter(prev => ({
                ...prev,
                platforms: prev.platforms.includes(platform)
                  ? prev.platforms.filter(p => p !== platform)
                  : [...prev.platforms, platform]
              }))}
              className={`px-4 py-2 rounded-full ${
                filter.platforms.includes(platform)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
          <button
            key="filter-bookmarked"
            onClick={() => setFilter(prev => ({
              ...prev,
              showBookmarkedOnly: !prev.showBookmarkedOnly
            }))}
            className={`px-4 py-2 rounded-full ${
              filter.showBookmarkedOnly
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Bookmarked Only
          </button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {upcomingContests.length > 0 && renderContestList(upcomingContests, 'Upcoming Contests')}
        {pastContests.length > 0 && renderContestList(pastContests, 'Past Contests')}
        
        {filteredContests.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300">No contests found matching your filters.</p>
          </div>
        )}
      </motion.div>

      {selectedContest && (
        <ReminderModal
          contest={selectedContest}
          onClose={() => setSelectedContest(null)}
          onSuccess={fetchContests}
        />
      )}
    </div>
  );
};

export default ContestList;