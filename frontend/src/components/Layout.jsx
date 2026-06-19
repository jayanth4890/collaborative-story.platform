import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Menu,
  X,
  User,
  Feather,
  Globe,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const navItems = [
    {
      to: '/',
      label: 'Explore Feed',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      to: '/public-stories',
      label: 'Public Library',
      icon: <Globe className="w-5 h-5" />,
    },
    // Dashboard is visible to contributors, authors, and admins
    ...(user && ['contributor', 'author', 'admin'].includes(user.role) ? [{
      to: '/dashboard',
      label: 'My Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    }] : []),
    // Story creation is restricted to authors and admins
    ...(user && ['author', 'admin'].includes(user.role) ? [{
      to: '/story/create',
      label: 'Create Story',
      icon: <PlusCircle className="w-5 h-5" />,
    }] : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <Feather className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            ScribbleCollab
          </h1>
          <span className="text-xs text-slate-500 font-medium">Co-Writing Hub</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section / Bottom Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-2 py-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-200 truncate">
                  {user.username}
                </h4>
                <p className="text-xs text-slate-500 truncate mb-1">{user.email}</p>
                {user.role && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    user.role === 'admin'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                      : user.role === 'author'
                      ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20'
                      : user.role === 'contributor'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {user.role}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-500 text-center px-1">Log in to collaborate on stories or post reviews</p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white transition-all text-xs font-bold"
            >
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 transition-transform duration-300 transform md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full relative">
          {sidebarContent}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-[-48px] p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Banner */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <Feather className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              ScribbleCollab
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
