import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StoryCard from '../components/StoryCard';
import InvitationCard from '../components/InvitationCard';
import ContributionCard from '../components/ContributionCard';
import Spinner from '../components/Spinner';
import { SkeletonGrid } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Mail,
  Feather,
  Plus,
  Lock,
  Users,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stories'); // 'stories', 'invitations', 'contributions'
  
  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // User management states
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      const [storiesRes, invitationsRes, contributionsRes] = await Promise.all([
        api.get('/stories/my-stories'),
        api.get('/invitations/my-invitations'),
        api.get('/contributions/my-contributions'),
      ]);
      setStories(storiesRes.data);
      setInvitations(invitationsRes.data);
      setContributions(contributionsRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get('/dashboard/analytics');
      setAnalyticsData(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch analytics metrics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/auth/all-users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch users list', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const res = await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      showToast('User role updated successfully!', 'success');
      // Update state
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: res.data.role } : u))
      );
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    setDeletingUserId(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      showToast('User deleted successfully!', 'success');
      // Update state
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchDashboardData();
      if (activeTab === 'analytics') {
        fetchAnalytics();
      }
    };

    socket.on('invitation_received', handleRefresh);
    socket.on('invitation_accepted', handleRefresh);
    socket.on('contribution_submitted', handleRefresh);
    socket.on('contribution_approved', handleRefresh);
    socket.on('contribution_rejected', handleRefresh);

    return () => {
      socket.off('invitation_received', handleRefresh);
      socket.off('invitation_accepted', handleRefresh);
      socket.off('contribution_submitted', handleRefresh);
      socket.off('contribution_approved', handleRefresh);
      socket.off('contribution_rejected', handleRefresh);
    };
  }, [socket, activeTab]);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const pendingContributions = contributions.filter((c) => c.status === 'pending');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-6 animate-pulse">
        <div className="h-9 w-48 bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 h-24 rounded-2xl" />
          <div className="bg-slate-900/50 border border-slate-800 h-24 rounded-2xl" />
          <div className="bg-slate-900/50 border border-slate-800 h-24 rounded-2xl" />
        </div>
        <SkeletonGrid count={3} />
      </div>
    );
  }

  const tabs = [
    { id: 'stories', label: 'My Stories', count: stories.length },
    { id: 'invitations', label: 'Invitations', count: invitations.length, alertCount: pendingInvitations.length },
    { id: 'contributions', label: 'Contributions', count: contributions.length },
    { id: 'analytics', label: 'Advanced Analytics', count: 'Stats' },
  ];

  if (user?.role === 'admin') {
    tabs.push({ id: 'users', label: 'Manage Users', count: usersList.length });
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            <span>Dashboard Workspace</span>
          </h1>
          <p className="text-sm text-slate-400">Manage your drafted stories, collaborative invitations, and submissions</p>
        </div>
        <Link
          to="/story/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Story</span>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Total Stories</span>
            <span className="text-3xl font-extrabold text-indigo-400">{stories.length}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Invitations</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-400">{invitations.length}</span>
              {pendingInvitations.length > 0 && (
                <span className="text-xs font-medium text-amber-400">({pendingInvitations.length} pending)</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Contributions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-400">{contributions.length}</span>
              {pendingContributions.length > 0 && (
                <span className="text-xs font-medium text-amber-400">({pendingContributions.length} pending)</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Feather className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap -mb-[2px] ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-indigo-600/15 text-indigo-400'
                  : 'bg-slate-800/60 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
            {tab.alertCount > 0 && (
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === 'stories' && (
          stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <StoryCard key={story._id} story={story} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No stories yet"
              description="You are not the author or contributor of any story drafts yet."
              action={
                <Link
                  to="/story/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-650 hover:bg-indigo-550 active:scale-[0.98] rounded-2xl text-xs font-bold text-white shadow-xl shadow-indigo-650/10 transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft Story</span>
                </Link>
              }
            />
          )
        )}

        {activeTab === 'invitations' && (
          invitations.length > 0 ? (
            <div className="space-y-4 max-w-4xl">
              {invitations.map((invitation) => (
                <InvitationCard
                  key={invitation._id}
                  invitation={invitation}
                  onResponse={fetchDashboardData}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Mail}
              title="Clean Inbox"
              description="You haven't received any collaboration invites from other storytellers."
            />
          )
        )}

        {activeTab === 'contributions' && (
          contributions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {contributions.map((contribution) => (
                <ContributionCard
                  key={contribution._id}
                  contribution={contribution}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Feather}
              title="No drafts sent"
              description="You haven't drafted sections for any collaborative stories yet."
            />
          )
        )}

        {activeTab === 'analytics' && (
          analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-pulse">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 h-24 rounded-2xl" />
              ))}
            </div>
          ) : analyticsData ? (
            <div className="space-y-8 animate-fade-in">
              {/* Premium Analytics Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                
                {/* Total Stories Card */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Total Stories</span>
                    <span className="text-2xl font-extrabold text-slate-100">{analyticsData.totalStories}</span>
                  </div>
                  <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                {/* Completed Stories Card */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Completed</span>
                    <span className="text-2xl font-extrabold text-slate-100">{analyticsData.completedStories}</span>
                  </div>
                  <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>

                {/* Contributions Card */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Contributions</span>
                    <span className="text-2xl font-extrabold text-slate-100">{analyticsData.totalContributions}</span>
                  </div>
                  <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl group-hover:scale-105 transition-transform">
                    <Feather className="w-5 h-5" />
                  </div>
                </div>

                {/* Active Collaborators Card */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Collaborators</span>
                    <span className="text-2xl font-extrabold text-slate-100">{analyticsData.activeCollaborators}</span>
                  </div>
                  <div className="p-3 bg-violet-600/10 text-violet-400 rounded-xl group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* Pending Invitations Card */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Pending Invites</span>
                    <span className="text-2xl font-extrabold text-slate-100">{analyticsData.pendingInvitations}</span>
                  </div>
                  <div className="p-3 bg-rose-600/10 text-rose-400 rounded-xl group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Premium Charts Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Stories Created Over Time Area Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Stories Created Over Time</h3>
                    <p className="text-[11px] text-slate-500">Volume of new creative plots created recently</p>
                  </div>
                  <div className="h-64 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="480" y2="30" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
                      <line x1="40" y1="80" x2="480" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
                      <line x1="40" y1="130" x2="480" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
                      <line x1="40" y1="160" x2="480" y2="160" stroke="#334155" strokeWidth="1.5" />

                      {/* Render Area and Line */}
                      {(() => {
                        const maxCount = Math.max(...analyticsData.storiesOverTime.map(d => d.count), 1);
                        const width = 500;
                        const height = 200;
                        const padding = 40;
                        const pts = analyticsData.storiesOverTime.map((d, index) => {
                          const x = padding + (index * (width - 2 * padding)) / (analyticsData.storiesOverTime.length - 1 || 1);
                          const y = height - padding - (d.count * (height - 2 * padding - 20)) / maxCount;
                          return { x, y, label: d.count, date: d.date };
                        });
                        
                        const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height - padding} L ${pts[0].x} ${height - padding} Z`;

                        return (
                          <>
                            <path d={areaPath} fill="url(#chartGradient)" />
                            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                            {pts.map((p, i) => (
                              <g key={i}>
                                <circle cx={p.x} cy={p.y} r="5" fill="#020617" stroke="#818cf8" strokeWidth="2.5" />
                                <text x={p.x} y={p.y - 10} fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
                                  {p.label}
                                </text>
                                <text x={p.x} y="180" fill="#64748b" fontSize="8" fontWeight="semibold" textAnchor="middle">
                                  {p.date.slice(5)}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* 2. Completion Rate Donut/Circular Gauge */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Completion Rate</h3>
                    <p className="text-[11px] text-slate-500">Percentage of finished manuscripts vs. ongoing drafts</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-4 relative">
                    <svg className="w-36 h-36" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="url(#donutGradient)"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 - (analyticsData.completionRate / 100) * (2 * Math.PI * 50)}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                      <defs>
                        <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-100">{analyticsData.completionRate}%</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Locked</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 block">Ongoing Drafts</span>
                      <span className="text-sm font-bold text-slate-300">{analyticsData.totalStories - analyticsData.completedStories}</span>
                    </div>
                    <div className="text-center border-l border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Completed Stories</span>
                      <span className="text-sm font-bold text-slate-300">{analyticsData.completedStories}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Contributions per Story Bar Chart */}
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Volume of Contributions per Story</h3>
                    <p className="text-[11px] text-slate-500">Stories showing the highest collaborator write-up counts</p>
                  </div>

                  <div className="space-y-4">
                    {analyticsData.contributionsPerStory.map((storyItem, idx) => {
                      const maxCount = Math.max(...analyticsData.contributionsPerStory.map(d => d.count), 1);
                      const barPercent = Math.round((storyItem.count / maxCount) * 100);
                      const barColors = [
                        'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-indigo-500/10',
                        'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-500/10',
                        'bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-fuchsia-500/10',
                        'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/10',
                        'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/10'
                      ];

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span className="truncate max-w-[70%]">{storyItem.title}</span>
                            <span className="text-indigo-400 font-bold">{storyItem.count} contribution{storyItem.count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-slate-850 h-3 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${barPercent}%` }}
                              className={`h-full rounded-full transition-all duration-1000 ${barColors[idx % barColors.length]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Failed to load analytics"
              description="Failed to retrieve dashboard statistics. Please check your database connection."
            />
          )
        )}

        {activeTab === 'users' && user?.role === 'admin' && (
          usersLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-12 w-full bg-slate-900/50 border border-slate-800 rounded-2xl" />
              <div className="h-64 w-full bg-slate-900/50 border border-slate-800 rounded-3xl" />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Manage Platform Users</span>
                  </h3>
                  <p className="text-xs text-slate-400">View registered members, update roles, and manage account access</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 rounded-xl">
                  Total Users: {usersList.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-4">User</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Role Permission</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {usersList.map((usr) => {
                      const isSelf = usr._id === user?._id;
                      return (
                        <tr key={usr._id} className="hover:bg-slate-950/30 transition-colors duration-150">
                          <td className="py-4 px-4 font-semibold text-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-950/40 border border-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                                {usr.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-200">{usr.username}</p>
                                <p className="text-[10px] text-slate-500">ID: {usr._id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-medium">{usr.email}</td>
                          <td className="py-4 px-4">
                            {isSelf ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/40 border border-purple-500/30 text-purple-400 uppercase">
                                Admin (You)
                              </span>
                            ) : (
                              <select
                                value={usr.role}
                                disabled={updatingUserId === usr._id}
                                onChange={(e) => handleUpdateRole(usr._id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-1.5 px-3 text-xs text-slate-355 outline-none transition-all cursor-pointer font-semibold uppercase"
                              >
                                <option value="reader">Reader</option>
                                <option value="contributor">Contributor</option>
                                <option value="author">Author</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(usr._id)}
                                disabled={deletingUserId === usr._id}
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-850 hover:border-rose-500/30 bg-slate-900/60 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 transition-all duration-200"
                                title="Delete User"
                              >
                                {deletingUserId === usr._id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-rose-450 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;
