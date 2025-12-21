import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { format } from "date-fns";
import api from "../configs/api";
import { getSocket, SocketEvents } from "../services/socket";

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/notifications");
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNewNotification = (payload) => {
            setNotifications((prev) => [payload.notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        };

        socket.on("notification:new", handleNewNotification);

        return () => {
            socket.off("notification:new", handleNewNotification);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
                <Bell className="size-5 text-zinc-600 dark:text-zinc-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 flex items-center justify-center bg-zinc-600 text-white text-xs rounded-full">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                    <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-700">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
                            >
                                <CheckCheck className="size-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-zinc-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer ${
                                        !notification.isRead ? "bg-zinc-50 dark:bg-zinc-800/50" : ""
                                    }`}
                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                                {notification.createdAt
                                                    ? format(new Date(notification.createdAt), "dd MMM, HH:mm")
                                                    : ""}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="size-2 rounded-full bg-zinc-500 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
