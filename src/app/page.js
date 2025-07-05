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
      .then((data) => {
        const contestsInUTC = (data.contests || []).map((contest) => {
          const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in ms
          return {
            ...contest,
            startTime: new Date(new Date(contest.startTime).getTime() - istOffset).toISOString(),
            endTime: new Date(new Date(contest.endTime).getTime() - istOffset).toISOString(),
          };
        });

        setContests((prev) => ({ ...prev, bookmarked: contestsInUTC }));
      })
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
    // const now = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
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


  const finalContests = (() => {
    const list = filteredContests();
    const now = new Date();

    if (selectedTab !== 'Finished') {
      const upcomingOrLive = list.filter(c => new Date(c.endTime) > now);
      const finished = list.filter(c => new Date(c.endTime) <= now);
      return [...upcomingOrLive, ...finished]; // ⬅️ Push finished ones to bottom
    }

    return list;
  })();



  return (
    <ProtectedRoute>
      <Navbar />
      <div className="flex h-screen overflow-y-clip pb-20">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 h-full pt-20 left-0 z-40 w-64 transform bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } sm:translate-x-0 md:bg-gradient-to-r md:from-orange-200/10 md:via-orange-200/10 md:to-gray-500/20 glass-refract-border shadow-2xl`}
        >

          <div className="h-full flex flex-col p-4">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between sm:hidden mb-4">
              <h2 className="text-lg font-semibold text-gray dark:text-white">Filters</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-600 dark:text-gray-300"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <h3 className="text-xl italic underline font-semibold text-gray-200 mb-2">Tabs</h3>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const isSelected = selectedTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setSelectedTab(tab);
                        setSidebarOpen(false);
                      }}
                      className={`cursor-pointer w-full text-sm px-5 py-2.5 rounded-lg font-medium text-center mb-2 transition ${isSelected
                        ? 'text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg shadow-cyan-500/50 dark:shadow-lg dark:shadow-cyan-800/80'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Filters */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xl italic underline font-semibold text-gray-300 mb-2">Platforms</h3>
              <div className="space-y-2">
                {platformOptions.map(({ name, key }) => {
                  const isActive = selectedPlatforms.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => togglePlatform(key)}
                      className={`cursor-pointer w-full text-sm px-5 py-2.5 rounded-lg font-medium text-center mb-2 transition ${isActive
                        ? 'text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg shadow-cyan-500/50 dark:shadow-lg dark:shadow-cyan-800/80'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {name}
                    </button>
                  );
                })}



              </div>
              <button
                onClick={toggleAll}
                className={`cursor-pointer w-full mt-4 text-sm px-5 py-2.5 rounded-lg font-semibold text-center mb-2 transition ${selectedPlatforms.length === platformOptions.length
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'text-white bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yello-300 dark:focus:ring-orange-800 shadow-lg shadow-orange-500/50 dark:shadow-lg dark:shadow-orange-800/80'
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
          <div className="sm:hidden sticky top-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
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

                  return (() => {
                    const istOffset = 5.5 * 60 * 60 * 1000;
                    const adjustedContest =
                      selectedTab === 'Bookmarks'
                        ? {
                          ...contest,
                          startTime: new Date(new Date(contest.startTime).getTime() + istOffset).toISOString(),
                          endTime: new Date(new Date(contest.endTime).getTime() + istOffset).toISOString(),
                        }
                        : contest;

                    return (
                      <CardComponent
                        key={`${contest.name}-${contest.startTime}`}
                        contest={adjustedContest}
                        show={selectedPlatforms}
                      />
                    );
                  })();
                })
              ) : (
                <div className="justify-center flex flex-col pt-10 text-center h-full w-full row-span-full col-span-full text-gray-500 dark:text-gray-300">
                  <div className='drop-shadow-black rounded-4xl shadow-2xl py-20'>
                    <img src="/empty1.png" alt="No contests" className="mx-auto my-auto" />
                    <span className='text-black font-bold text-4xl italic underline'>Empty</span>
                  </div>
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
