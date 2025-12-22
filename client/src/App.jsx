import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './pages/Layout'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Team from './pages/Team'
import ProjectDetails from './pages/ProjectDetails'
import TaskDetails from './pages/TaskDetails'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import MyTasks from './pages/MyTasks'
import { useAuth } from './context/AuthContext'

// Wrapper for public routes - redirect to home if already logged in
const PublicRoute = ({ children }) => {
    const { isSignedIn, isLoaded } = useAuth()

    if (!isLoaded) return null

    if (isSignedIn) {
        return <Navigate to="/" replace />
    }

    return children
}

const App = () => {
    return (
        <>
            <Toaster />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes - Layout handles auth check */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projectsDetail" element={<ProjectDetails />} />
                    <Route path="taskDetails" element={<TaskDetails />} />
                    <Route path="my-tasks" element={<MyTasks />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </>
    )
}

export default App
