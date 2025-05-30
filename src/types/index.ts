export interface Contest {
  _id: string;
  name: string;
  platform: 'codeforces' | 'codechef' | 'leetcode';
  startTime: Date;
  endTime: Date;
  url: string;
  isBookmarked: boolean;
  bookmarkedBy: string[];
  solutionUrl?: string;
}

export interface Filter {
  platforms: string[];
  showPastContests: boolean;
  showUpcomingContests: boolean;
  showBookmarkedOnly: boolean;
}

export interface Theme {
  isDarkMode: boolean;
  toggleTheme: () => void;
}