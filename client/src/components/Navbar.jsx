import { PanelLeft, LogOut, User, AlertTriangle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { resetWorkspaceState } from '../features/workspaceSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import SearchDropdown from './SearchDropdown'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector(state => state.theme);
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            dispatch(resetWorkspaceState());
            navigate('/login');
        } finally {
            setIsLoggingOut(false);
            setShowLogoutConfirm(false);
        }
    };

    const openLogoutConfirm = () => {
        setShowDropdown(false);
        setShowLogoutConfirm(true);
    };

    return (
        <div className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800" >
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input */}
                    <SearchDropdown />
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">

                    {/* Notification Bell */}
                    <NotificationBell />

                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-zinc-800 dark:text-zinc-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-sm font-medium">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg animate-fade-in-up py-1 z-50">
                                <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <User className="size-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={openLogoutConfirm}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <LogOut className="size-4" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl animate-modal-enter p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Sign Out</h3>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                            Are you sure you want to sign out? You will need to log in again to access your workspace.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="px-4 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                            >
                                <LogOut className="size-4" />
                                {isLoggingOut ? "Signing out..." : "Sign Out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Navbar
