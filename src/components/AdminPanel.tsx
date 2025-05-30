import React, { useState, useEffect } from 'react';
import { Youtube } from 'lucide-react';
import axios from 'axios';
import { Contest } from '../types';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [solutionUrl, setSolutionUrl] = useState<string>('');
  const [contests, setContests] = useState<Contest[]>([]);
  const [message, setMessage] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState('');
  const { isAdmin, verifyAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchContests();
  }, [isAdmin]);

  const fetchContests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contests`);
      const sortedContests = (Array.isArray(response.data) ? response.data : [])
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setContests(sortedContests);
    } catch (error) {
      console.error('Error fetching contests:', error);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyAdmin(adminPassword);
    } catch (error) {
      setMessage('Invalid admin password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContest) {
      setMessage('Please select a contest first');
      return;
    }
    try {
      await axios.patch(`${API_BASE_URL}/api/contests/${selectedContest}/solution`, {
        solutionUrl
      });
      setMessage('Solution URL updated successfully!');
      setSolutionUrl('');
      setSelectedContest('');
      await fetchContests();
    } catch (error) {
      setMessage('Error updating solution URL');
      console.error('Error:', error);
    }
  };

  const handleForceUpdate = async () => {
    try {
      setMessage('Updating contests...');
      await axios.post(`${API_BASE_URL}/api/contests/update`);
      setMessage('Contests updated successfully!');
      await fetchContests();
    } catch (error) {
      setMessage('Error updating contests');
      console.error('Error:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Login</h2>
        <form onSubmit={handleAdminLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          {message && (
            <div className="text-red-500 text-sm mb-4">{message}</div>
          )}
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login as Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Admin Panel
        </h1>

        <button
          onClick={handleForceUpdate}
          className="mb-8 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Force Update Contests
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="contest"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Select Contest
            </label>
            <select
              id="contest"
              value={selectedContest}
              onChange={(e) => setSelectedContest(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="">Select a contest...</option>
              {contests.map(contest => (
                <option key={contest._id} value={contest._id}>
                  {contest.name} ({contest.platform})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="solutionUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Solution URL
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <Youtube className="w-5 h-5" />
              </span>
              <input
                type="url"
                id="solutionUrl"
                value={solutionUrl}
                onChange={(e) => setSolutionUrl(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Update Solution URL
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
              : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;