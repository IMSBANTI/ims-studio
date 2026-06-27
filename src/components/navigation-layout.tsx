"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { handleLogout } from "@/app/actions/auth";
import { SessionUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

interface NavigationLayoutProps {
  user: SessionUser;
  notifications: any[];
  children: React.ReactNode;
}

export const NavigationLayout: React.FC<NavigationLayoutProps> = ({
  user,
  notifications: initialNotifications,
  children,
}) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: Briefcase },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Time Logs", href: "/time-logs", icon: Clock },
    { name: "Team", href: "/team", icon: Users },
    { name: "Brief Tracking", href: "/business-development", icon: TrendingUp },
    { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const handleLogoutClick = async () => {
    await handleLogout();
  };

  // Get initials for profile avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const currentPeriodStr = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white text-zinc-900 h-16 px-4 flex items-center justify-between border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/images/ims-logo-c.png" alt="IMS Studio Logo" className="h-8 w-auto object-contain" />
          <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase ml-1">STUDIO</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 hover:bg-zinc-100 rounded transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar navigation (White Background matching the screenshot) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white text-zinc-900 flex flex-col border-r border-zinc-200 transition-transform duration-300 ease-in-out md:translate-x-0 md:static shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <img src="/images/ims-logo-c.png" alt="IMS Studio Logo" className="h-9 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tighter text-studio-red leading-none">IMS STUDIO</span>
              <span className="text-[10px] text-zinc-500 font-bold leading-none mt-0.5">Work Management</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-zinc-100 rounded text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Details (Screenshot style bottom left) */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-zinc-800 truncate">{user.name}</p>
              <p className="text-[9px] text-zinc-500 font-medium leading-none truncate mt-0.5">{user.roleName}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="p-1.5 hover:bg-red-50 hover:text-studio-red rounded text-zinc-400 transition-colors"
            title="Logout Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Top Header navbar (White matching screenshot) */}
        <header className="hidden md:flex h-16 bg-white border-b border-zinc-200 px-8 items-center justify-between shrink-0">
          {/* Current Period selection */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase leading-none">Current Period</span>
            <span className="text-xs font-bold text-zinc-800 mt-1">{currentPeriodStr}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 rounded-full relative transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-studio-red text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 mb-2">
                    <span className="text-xs font-bold text-zinc-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[9px] font-bold text-studio-red hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto px-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2 rounded text-xs transition-colors hover:bg-zinc-50 ${
                            !n.isRead ? "bg-red-50/20 border-l-2 border-studio-red" : "opacity-75"
                          }`}
                        >
                          <p className="font-semibold text-zinc-800">{n.title}</p>
                          <p className="text-zinc-500 mt-0.5">{n.content}</p>
                          <span className="text-[8px] text-zinc-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Month selector dropdown matching top right */}
            <div className="border border-zinc-200 rounded-md px-3 py-1 bg-white flex items-center text-xs font-semibold text-zinc-700">
              {currentPeriodStr}
            </div>

            {/* Profile widget matching top right */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2 border border-zinc-200 p-1.5 pr-2.5 rounded-lg bg-white transition-colors text-left"
              >
                <div className="w-6.5 h-6.5 rounded bg-teal-800 text-white flex items-center justify-center font-black text-xs">
                  {getInitials(user.name)}
                </div>
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold text-zinc-800">{user.name}</p>
                  <p className="text-[8px] text-zinc-400 mt-0.5 font-bold">{user.roleName}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-1 shrink-0" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-[10px] font-bold text-zinc-800">{user.name}</p>
                    <p className="text-[8px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log out Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
