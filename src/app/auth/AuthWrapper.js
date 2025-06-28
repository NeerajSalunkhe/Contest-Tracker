
export const metadata = {
  title: 'Contest Tracker',
  description: 'Track all coding contests in one place',
  icons: {
    icon: '/remind.png', // relative to /public
  },
};

export default function AuthWrapper({ children }) {
    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden flex flex-col md:grid md:grid-cols-2">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-pulse opacity-30 blur-2xl" />

            {/* Promo Section - top on mobile, left on desktop */}
            <div className="flex flex-col justify-center items-center md:items-start px-6 md:px-16 py-10 gap-4 relative z-10 text-center md:text-left">
                <img
                    src="/contest.gif"
                    alt="Contest Animation"
                    className="w-40 h-40 md:w-64 md:h-64 object-contain drop-shadow-lg"
                />
                <h1 className="text-3xl md:text-4xl font-bold">🚀 Contest Tracker</h1>
                <p className="text-base md:text-lg text-gray-100">
                    Track all coding contests across platforms in one dashboard.
                </p>
            </div>

            {/* SignIn Section */}
            <div className="flex items-center justify-center px-4 py-8 md:p-6 relative z-10">
                {children}
            </div>
        </div>
    );
}
