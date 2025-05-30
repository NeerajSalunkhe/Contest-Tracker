import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Trophy, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Contest Tracker
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/admin"
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
            >
              <Settings className="h-5 w-5" />
              <span>Admin</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;