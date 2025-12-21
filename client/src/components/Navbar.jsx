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
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
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
                                ? (<MoonIcon className="size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-sm font-medium">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                    <User className="size-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={openLogoutConfirm}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-sm mx-4">
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
                                className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
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
