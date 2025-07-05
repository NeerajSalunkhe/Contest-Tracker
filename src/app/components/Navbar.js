'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './ProtectedRoute';
export default function Navbar() {
    const pathname = usePathname();
    const { isSignedIn } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, isLoaded } = useUser();
    const navLinks = [
        { name: 'Contests', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
    ];

    return (
        <ProtectedRoute>
            <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 backdrop-blur-xs shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Left: Logo and Nav */}
                    <div className="flex items-center md:gap-6 gap-3">
                        <img src="/contest.gif" className='md:w-10 md:h-10 w-10 h-10' alt="" />
                        <Link
                            href="/"
                            className="text-3xl font-bold text-blue-950 drop-shadow-md"
                        >
                            Contest-Tracker
                        </Link>
                        <div className="text-black hidden sm:block">|</div>
                        <div className="hidden sm:flex gap-6">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="relative text-sm font-semibold text-black transition-all duration-300 hover:text-yellow-200"
                                    >
                                        {link.name}
                                        <span
                                            className={`absolute left-0 -bottom-1 h-[2px] w-full transition-transform duration-300 bg-yellow-300 shadow-md rounded-full transform ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                                }`}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Mobile Menu Toggle + Auth */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Mobile Hamburger */}
                        <button
                            className="sm:hidden text-black text-2xl focus:outline-none"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
                        </button>

                        {/* Clerk User/Sign In */}
                        {isSignedIn ? (
                            <UserButton afterSignOutUrl="/" />
                        ) : (
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium bg-white/20 hover:bg-white/30 text-black px-4 py-2 rounded-lg backdrop-blur-md transition">
                                    Sign In
                                </button>
                            </SignInButton>
                        )}
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {menuOpen && (
                    <div className="sm:hidden px-4 pb-4">
                        <div className="flex flex-col gap-2 bg-white/10 rounded-xl p-4 text-black backdrop-blur-md">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`text-sm font-medium px-3 py-2 rounded-lg transition ${isActive
                                            ? 'bg-white/20 text-yellow-200'
                                            : 'hover:bg-white/10'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
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
            </nav>
        </ProtectedRoute>
    );
}
