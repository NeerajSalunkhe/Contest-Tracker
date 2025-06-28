'use client';

import { useEffect, useState } from 'react';
import ContestCard from './components/ContestCard';
import FinishedContestCard from './components/FinishedContestCard';
import SkeletonCard from './components/SkeletonCard';
import { useUser } from '@clerk/nextjs';
import { Menu as HamburgerIcon, X as CloseIcon } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

const platformOptions = [
  { name: 'Codeforces', key: 'codeforces.com' },
  { name: 'LeetCode', key: 'leetcode.com' },
  { name: 'CodeChef', key: 'codechef.com' },
];
const tabs = ['Upcoming', 'Finished', 'Bookmarks'];

export default function ContestsPage() {
  const { user, isLoaded } = useUser();
  const [contests, setContests] = useState({ upcoming: [], finished: [], bookmarked: [] });
  const [selectedTab, setSelectedTab] = useState('Upcoming');
  const [selectedPlatforms, setSelectedPlatforms] = useState(platformOptions.map(p => p.key));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const tab = localStorage.getItem('selectedTab');
    const plats = localStorage.getItem('selectedPlatforms');
    if (tabs.includes(tab)) setSelectedTab(tab);
    if (plats) {
      try {
        const parsed = JSON.parse(plats);
        if (Array.isArray(parsed)) setSelectedPlatforms(parsed);
      } catch { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedTab', selectedTab);
  }, [selectedTab]);

  useEffect(() => {
    localStorage.setItem('selectedPlatforms', JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  // Fetch Bookmarked contests
  useEffect(() => {
    if (!isLoaded || selectedTab !== 'Bookmarks') return;

    fetch('/api/get-bookmarked-contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid: user?.id }),
    })
      .then((res) => res.json())
      .then((data) =>
        setContests((prev) => ({ ...prev, bookmarked: data.contests || [] }))
      )
      .catch(console.error);
  }, [selectedTab, user?.id, isLoaded]);

  // Fetch all contests
  useEffect(() => {
    setLoading(true);

    fetch('/api/contests')
      .then((res) => res.json())
      .then((data) => {
        const upcomingContests = data.upcoming || [];
        const finishedContests = data.past || [];

        setContests((prev) => ({
          ...prev,
          upcoming: upcomingContests,
          finished: finishedContests,
        }));
      })
      .catch((err) => {
        console.error('Failed to fetch contests:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);






  const togglePlatform = (key) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    setSelectedPlatforms((prev) =>
      prev.length === platformOptions.length ? [] : platformOptions.map((p) => p.key)
    );
  };

  const filteredContests = () => {
    const now = new Date();
    const { upcoming = [], finished = [], bookmarked = [] } = contests;

    if (selectedTab === 'Bookmarks') {
      return bookmarked.filter((c) => selectedPlatforms.includes(c.platform));
    }

    const all = [...upcoming, ...finished];
    const filtered = all.filter((c) => selectedPlatforms.includes(c.platform));
    const unique = Array.from(
      new Map(filtered.map((c) => [`${c.name}-${c.startTime}`, c])).values()
    );

    if (selectedTab === 'Upcoming') {
      // ✅ Include live contests: startTime <= now < endTime
      return unique.filter((c) => new Date(c.endTime) > now);
    }

    if (selectedTab === 'Finished') {
      return unique.filter((c) => new Date(c.endTime) < now);
    }

    return [];
  };


  const finalContests = filteredContests();

  return (
    <ProtectedRoute>
      <Navbar/>
      <div className="flex h-screen overflow-y-clip">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 h-full pt-20 left-0 z-40 backdrop-blur-xs w-64 transform bg-white md:dark:bg-gray-900/80 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } sm:translate-x-0`}
        >
          <div className="h-full flex flex-col p-4">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between sm:hidden mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Filters</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-600 dark:text-gray-300"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Tabs</h3>
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedTab(tab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg cursor-pointer font-medium transition ${selectedTab === tab
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Filters */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Platforms</h3>
              <div className="space-y-2">
                {platformOptions.map(({ name, key }) => (
                  <button
                    key={key}
                    onClick={() => togglePlatform(key)}
                    className={`w-full cursor-pointer text-left px-4 py-2 rounded-lg font-medium transition ${selectedPlatforms.includes(key)
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : 'text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleAll}
                className={`w-full mt-4 cursor-pointer text-center px-4 py-2 rounded-lg font-semibold transition ${selectedPlatforms.length === platformOptions.length
                  ? 'bg-gray-500 text-white'
                  : 'bg-orange-400 hover:bg-orange-500 text-white'
                  }`}
              >
                {selectedPlatforms.length === platformOptions.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col sm:ml-64 h-full">
          {/* Mobile Top Bar */}
          <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <HamburgerIcon size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Contests</h1>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
              ) : finalContests.length > 0 ? (
                finalContests.map((contest) => {
                  const isFinished =
                    selectedTab === 'Finished' ||
                    (selectedTab === 'Bookmarks' && new Date(contest.endTime) < new Date());

                  const CardComponent = isFinished ? FinishedContestCard : ContestCard;

                  return (
                    <CardComponent
                      key={`${contest.name}-${contest.startTime}`}
                      contest={contest}
                      show={selectedPlatforms}
                    />
                  );
                })
              ) : (
                <div className="text-center h-full w-full row-span-full col-span-full text-gray-500 dark:text-gray-300">
                  <img src="/empty.svg" alt="No contests" className="mx-auto my-auto" />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* <ToastContainer
          autoClose={2000}
          closeOnClick
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
          className={'overflow-x-clip'}
        // style={{
        //     position: 'fixed',
        //     top: '1rem',
        //     left: '50%',
        //     transform: 'translateX(-50%)',
        //     zIndex: 9999,
        //     pointerEvents: 'none',
        // }}
        /> */}
      </div>
    </ProtectedRoute>
  );
}
