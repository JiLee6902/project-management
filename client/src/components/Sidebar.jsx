import { useEffect, useRef } from 'react'
import WorkspaceDropdown from './WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import { NavLink } from 'react-router-dom'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Team', href: '/team', icon: UsersIcon },
    ]

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <div ref={sidebarRef} className={`z-10 bg-white dark:bg-zinc-900 min-w-68 flex flex-col h-screen border-r border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none max-sm:absolute transition-all ${isSidebarOpen ? 'left-0' : '-left-full'} `} >
            <WorkspaceDropdown />
            <hr className='border-zinc-200 dark:border-zinc-800' />
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
                <div>
                    <div className='p-4'>
                        {menuItems.map((item) => (
                            <NavLink to={item.href} key={item.name} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 text-zinc-800 dark:text-zinc-100 cursor-pointer rounded-lg transition-all  ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 font-medium' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`} >
                                <item.icon size={16} />
                                <p className='text-sm truncate'>{item.name}</p>
                            </NavLink>
                        ))}
                        <NavLink to="/settings" className={({ isActive }) => `flex w-full items-center gap-3 py-2 px-4 text-zinc-800 dark:text-zinc-100 cursor-pointer rounded-lg transition-all ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 font-medium' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}>
                            <SettingsIcon size={16} />
                            <p className='text-sm truncate'>Settings</p>
                        </NavLink>
                    </div>
                    <MyTasksSidebar />
                    <ProjectSidebar />
                </div>


            </div>

        </div>
    )
}

export default Sidebar
