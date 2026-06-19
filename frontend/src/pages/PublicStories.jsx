import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicStories, getBookmarkedStories } from '../services/storyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonGrid } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import {
  BookOpen,
  Eye,
  Heart,
  Bookmark,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  BookMarked,
  LayoutGrid,
} from 'lucide-react';

const PublicStories = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stories, setStories] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending'); // 'trending', 'popular', 'latest', 'bookmarks'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      const res = await getPublicStories();
      setStories(res.data);

      if (user) {
        const bookmarksRes = await getBookmarkedStories();
        setBookmarks(bookmarksRes.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load published stories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, [user]);

  // Filter and sort logic
  const filteredStories = stories.filter((story) => {
    const matchQuery =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author?.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  const getSortedStories = () => {
    switch (activeTab) {
      case 'trending':
        // Sort by views count
        return [...filteredStories].sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'popular':
        // Sort by likes count
        return [...filteredStories].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      case 'latest':
        // Sort by publishedAt date
        return [...filteredStories].sort(
          (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt)
        );
      case 'bookmarks':
        // Filter bookmarks that match search
        return bookmarks.filter((story) =>
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return filteredStories;
    }
  };

  const displayStories = getSortedStories();

  // Highlight stories for the carousel / spotlight
  const spotlightStory = stories.length > 0
    ? [...stories].sort((a, b) => (b.views || 0) + (b.likes?.length || 0) * 3 - ((a.views || 0) + (a.likes?.length || 0) * 3))[0]
    : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-10 pb-16 pt-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-2xl" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-16">
      
      {/* Hero Spotlight Section (Medium/Wattpad Style banner) */}
      {spotlightStory && searchQuery === '' && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8 group">
          {/* Decorative blur elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-650/10 rounded-full blur-3xl group-hover:bg-indigo-650/15 transition-all duration-500 pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-fuchsia-650/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex-1 space-y-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editor's Spotlight</span>
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-100 tracking-tight leading-tight line-clamp-2">
              {spotlightStory.title}
            </h1>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed line-clamp-3 max-w-3xl">
              {spotlightStory.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold pt-2">
              <span>By <span className="text-indigo-400">@{spotlightStory.author?.username}</span></span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {spotlightStory.views || 0} views</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {spotlightStory.likes?.length || 0} likes</span>
            </div>
            <div className="pt-4">
              <Link
                to={`/public-story/${spotlightStory._id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-xs font-bold text-white rounded-2xl shadow-xl shadow-indigo-600/20 transition-all duration-200"
              >
                <span>Read Story Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-80 flex-shrink-0 z-10">
            {/* Styled Wattpad Book Cover Mock */}
            <div className="aspect-[2/3] w-full max-w-[220px] mx-auto bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none group-hover:border-indigo-500/40 transition-colors">
              <div className="absolute top-0 bottom-0 left-3 w-px bg-slate-800/40" />
              <div className="space-y-2">
                <BookOpen className="w-8 h-8 text-indigo-400/80" />
                <h3 className="text-md font-extrabold text-slate-200 font-serif leading-snug line-clamp-4">
                  {spotlightStory.title}
                </h3>
              </div>
              <div className="space-y-1.5 pt-4 border-t border-slate-800/60 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Collaborative Manuscript</span>
                <p className="text-indigo-400">ScribbleCollab</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Browse Panel */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Browse Published Masterpieces</span>
            </h2>
            <p className="text-xs text-slate-400">Read completed stories crafted collaboratively by our authors & contributors</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, description, writer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 shadow-inner"
            />
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-1.5 px-4.5 py-3 border-b-2 text-xs font-bold transition-all duration-250 -mb-[2px] ${
              activeTab === 'trending'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-350'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </button>

          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center gap-1.5 px-4.5 py-3 border-b-2 text-xs font-bold transition-all duration-250 -mb-[2px] ${
              activeTab === 'popular'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-355'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Popular</span>
          </button>

          <button
            onClick={() => setActiveTab('latest')}
            className={`flex items-center gap-1.5 px-4.5 py-3 border-b-2 text-xs font-bold transition-all duration-250 -mb-[2px] ${
              activeTab === 'latest'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-355'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Latest Arrivals</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-1.5 px-4.5 py-3 border-b-2 text-xs font-bold transition-all duration-250 -mb-[2px] ${
                activeTab === 'bookmarks'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-355'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>My Bookmarks</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] bg-slate-800/80 text-slate-400">
                {bookmarks.length}
              </span>
            </button>
          )}
        </div>

        {/* Stories Listing (Wattpad / Medium Style Grid) */}
        {displayStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {displayStories.map((story) => (
              <div
                key={story._id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(story.publishedAt || story.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[10px] text-indigo-455 font-bold uppercase">
                      By @{story.author?.username}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-md font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {story.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="pt-4 border-t border-slate-800/60 mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1" title={`${story.views || 0} views`}>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{story.views || 0}</span>
                    </span>
                    <span className="flex items-center gap-1" title={`${story.likes?.length || 0} likes`}>
                      <Heart className="w-3.5 h-3.5 text-slate-500" />
                      <span>{story.likes?.length || 0}</span>
                    </span>
                  </div>

                  <Link
                    to={`/public-story/${story._id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-950 border border-slate-850 hover:border-indigo-550/30 text-indigo-400 text-xs font-bold rounded-xl transition-all"
                  >
                    <span>Read Now</span>
                    <ArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={activeTab === 'bookmarks' ? BookMarked : BookOpen}
            title={activeTab === 'bookmarks' ? 'No Bookmarked Stories' : 'No Stories Found'}
            description={
              activeTab === 'bookmarks'
                ? 'Stories you bookmark while reading will show up here for easy access.'
                : 'There are no published stories matching your current browse options.'
            }
          />
        )}
      </div>
    </div>
  );
};

export default PublicStories;
