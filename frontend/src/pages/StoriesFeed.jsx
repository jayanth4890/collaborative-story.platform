import React, { useState, useEffect } from 'react';
import StoryCard from '../components/StoryCard';
import { SkeletonGrid } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { Search, Compass, BookOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStories } from '../services/storyService';

const StoriesFeed = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const fetchStories = async (pageNum, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const res = await getStories(pageNum, 9);
      const { stories: newStories, pagination } = res.data;

      setStories((prev) => append ? [...prev, ...newStories] : newStories);
      setHasMore(pagination.hasMore);
      setPage(pagination.page);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to load stories feed', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchStories(1, false);
  }, [showToast]);

  const handleLoadMore = () => {
    fetchStories(page + 1, true);
  };

  const filteredStories = stories.filter((story) => {
    const query = searchQuery.toLowerCase();
    return (
      story.title.toLowerCase().includes(query) ||
      story.description.toLowerCase().includes(query) ||
      story.author?.username?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/50 via-slate-900 to-indigo-950/20 border border-slate-800 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Discover Community Write-ups</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Explore Stories Feed
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Browse creative drafts and finished works from the ScribbleCollab community. Learn from peers, join collaborations, or start your own workspace.
          </p>
        </div>

        <Link
          to="/story/create"
          className="relative z-10 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-2xl text-sm font-semibold text-white shadow-xl shadow-indigo-600/15 transition-all duration-200"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Write a Story</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search stories by title, description, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all duration-200"
          />
        </div>
        <div className="text-xs font-medium text-slate-500 sm:ml-auto">
          Showing {filteredStories.length} of {stories.length} stories
        </div>
      </div>

      {/* Stories Listing */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : filteredStories.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-slate-900 border border-slate-800 hover:border-indigo-550/30 text-slate-350 hover:text-indigo-400 font-bold rounded-2xl text-xs active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
              >
                {loadingMore ? (
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Load More Stories</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Stories Found"
          description="We couldn't find any stories matching your search query. Try typing something else or draft a new story premise."
          action={
            <Link
              to="/story/create"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-2xl text-xs font-semibold text-white shadow-xl shadow-indigo-600/10 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Story</span>
            </Link>
          }
        />
      )}
    </div>
  );
};

export default StoriesFeed;
