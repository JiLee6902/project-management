import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkspaces } from '../features/workspaceSlice'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
import CreateWorkspaceDialog from '../components/CreateWorkspaceDialog'
import CommandPalette from '../components/CommandPalette'
import { connectSocket, disconnectSocket } from '../services/socket'
import { useSocket } from '../hooks/useSocket'
import { useCommandPalette } from '../hooks/useKeyboardShortcut'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const { user, isLoaded, isSignedIn } = useAuth()
    const { workspaces, loading } = useSelector((state) => state.workspace)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    // Initialize Command Palette shortcut (Cmd+K / Ctrl+K)
    useCommandPalette(setShowCommandPalette)

    useEffect(() => {
        dispatch(loadTheme())
    }, [])

    useEffect(() => {
        if (isSignedIn) {
            const token = localStorage.getItem('access_token')
            if (token) {
                connectSocket(token)
            }
        }
        return () => {
            disconnectSocket()
        }
    }, [isSignedIn])

    useSocket()

    // Initial load of workspaces
    useEffect(() => {
        if (isLoaded && isSignedIn && workspaces.length === 0) {
            dispatch(fetchWorkspaces())
        }
    }, [isLoaded, isSignedIn])

    // Auto-open create workspace dialog for new signups
    useEffect(() => {
        if (isLoaded && isSignedIn && !loading && workspaces.length === 0) {
            const isNewSignup = localStorage.getItem('newSignup')
            if (isNewSignup === 'true') {
                localStorage.removeItem('newSignup')
                setShowCreateWorkspace(true)
            }
        }
    }, [isLoaded, isSignedIn, loading, workspaces.length])

    // Redirect to login if not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login')
        }
    }, [isLoaded, isSignedIn, navigate])

    if (!isLoaded) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-zinc-500 animate-spin" />
            </div>
        )
    }

    if (!isSignedIn) {
        return null
    }

    if (loading) return (
        <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
            <Loader2Icon className="size-7 text-zinc-500 animate-spin" />
        </div>
    )

    if (isSignedIn && !loading && workspaces.length === 0) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-white dark:bg-zinc-950">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Welcome to Project Management</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Create your first workspace to get started</p>
                </div>
                <button
                    onClick={() => setShowCreateWorkspace(true)}
                    className="px-6 py-3 bg-gradient-to-br from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white rounded-lg transition"
                >
                    Create Workspace
                </button>
                <CreateWorkspaceDialog isOpen={showCreateWorkspace} setIsOpen={setShowCreateWorkspace} />
            </div>
        )
    }

    return (
        <>
            <div className="flex bg-white dark:bg-zinc-950 text-zinc-900 dark:text-slate-100">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 flex flex-col h-screen">
                    <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                    <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Command Palette - Cmd+K / Ctrl+K */}
            <CommandPalette isOpen={showCommandPalette} setIsOpen={setShowCommandPalette} />
        </>
    )
}

export default Layout
