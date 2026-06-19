import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import { sanitizeHtml } from '../utils/sanitize';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Eye,
  Send,
  MessageSquare,
  Clock,
  Palette,
  Type,
  Calendar,
  Sparkles,
} from 'lucide-react';

const PublicStoryDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Customizer states for Wattpad/Medium reader mode
  const [readerTheme, setReaderTheme] = useState('dark'); // 'dark', 'sepia', 'light'
  const [fontSize, setFontSize] = useState('base'); // 'sm', 'base', 'lg', 'xl', '2xl'
  const [fontFamily, setFontFamily] = useState('serif'); // 'serif', 'sans'

  // Comments states
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPublicStoryDetails = async () => {
    try {
      setLoading(true);
      // Increment views count silently on landing
      try {
        await api.post(`/stories/${id}/view`);
      } catch (viewErr) {
        console.error('Silent view counter error:', viewErr.message);
      }

      // Fetch public details
      const res = await api.get(`/stories/public/${id}`);
      setStory(res.data);
      setLikesCount(res.data.likes?.length || 0);

      if (user) {
        setIsLiked(res.data.likes?.includes(user._id) || false);

        // Fetch bookmarks to see if this story is bookmarked
        const bookmarksRes = await api.get('/stories/my-bookmarks');
        setIsBookmarked(bookmarksRes.data.some((b) => b._id === id));
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to load story details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStoryDetails();
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      return showToast('Please register or log in to like stories!', 'info');
    }
    try {
      const res = await api.patch(`/stories/${id}/like`);
      setIsLiked(res.data.likes?.includes(user._id) || false);
      setLikesCount(res.data.likes?.length || 0);
      showToast(isLiked ? 'Story unliked' : 'Story liked!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle like', 'error');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      return showToast('Please register or log in to bookmark stories!', 'info');
    }
    try {
      const res = await api.patch(`/stories/${id}/bookmark`);
      setIsBookmarked(res.data.isBookmarked);
      showToast(res.data.isBookmarked ? 'Story added to bookmarks!' : 'Story removed from bookmarks', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle bookmark', 'error');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      return showToast('Please register or log in to write reviews/comments!', 'info');
    }
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/stories/${id}/comment`, { text: commentText });
      setStory(res.data);
      setCommentText('');
      showToast('Comment posted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-rose-500">Story Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">This story may have been un-published or deleted by the administrator.</p>
        <Link to="/public-stories" className="text-indigo-400 font-semibold hover:underline">Browse other stories</Link>
      </div>
    );
  }

  // Typography font size mapping
  const sizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base md:text-lg leading-relaxed',
    lg: 'text-lg md:text-xl leading-relaxed',
    xl: 'text-xl md:text-2xl leading-relaxed',
    '2xl': 'text-2xl md:text-3xl leading-relaxed',
  };

  // Reader panel theme mapping
  const themeClasses = {
    dark: 'bg-slate-900 border-slate-800 text-slate-200',
    sepia: 'bg-[#faf4e8] border-[#e7dec7] text-[#433422]',
    light: 'bg-white border-slate-200 text-slate-800',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Return & Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/public-stories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        {/* Reader customization toggles */}
        <div className="flex items-center gap-3">
          {/* Theme customizer drop downs */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setReaderTheme('light')}
              className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                readerTheme === 'light' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-250'
              }`}
              title="Light Theme"
            >
              A
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                readerTheme === 'sepia' ? 'bg-[#ebdcb9] text-[#433422] shadow-md' : 'text-slate-400 hover:text-slate-250'
              }`}
              style={{ backgroundColor: readerTheme === 'sepia' ? '#ebdcb9' : 'transparent' }}
              title="Sepia Theme"
            >
              S
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                readerTheme === 'dark' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400 hover:text-slate-250'
              }`}
              title="Dark Theme"
            >
              D
            </button>
          </div>

          {/* Font Controls dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase"
              title="Change Font Family"
            >
              {fontFamily === 'serif' ? 'Serif' : 'Sans'}
            </button>
            <span className="w-px h-3 bg-slate-800" />
            <button
              onClick={() => {
                const sizes = ['sm', 'base', 'lg', 'xl', '2xl'];
                const idx = sizes.indexOf(fontSize);
                if (idx > 0) setFontSize(sizes[idx - 1]);
              }}
              disabled={fontSize === 'sm'}
              className="w-6 h-6 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              title="Decrease text size"
            >
              A-
            </button>
            <button
              onClick={() => {
                const sizes = ['sm', 'base', 'lg', 'xl', '2xl'];
                const idx = sizes.indexOf(fontSize);
                if (idx < sizes.length - 1) setFontSize(sizes[idx + 1]);
              }}
              disabled={fontSize === '2xl'}
              className="w-6 h-6 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              title="Increase text size"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full text-[10px]">
            <Sparkles className="w-3 h-3" />
            <span>Masterpiece</span>
          </span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Published {new Date(story.publishedAt || story.createdAt).toLocaleDateString()}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 leading-tight">
          {story.title}
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
          {story.description}
        </p>

        {/* Metadata section */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-850 pt-4 gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 font-semibold">
            <span>Author: <span className="text-indigo-400 font-bold">@{story.author?.username}</span></span>
            {story.contributors?.length > 0 && (
              <span>Collaborators: <span className="text-slate-350">{story.contributors.map((c) => c.username).join(', ')}</span></span>
            )}
          </div>

          {/* Social interact widgets */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-500" title={`${story.views || 0} views`}>
              <Eye className="w-4 h-4 text-slate-500" />
              <span>{story.views || 0}</span>
            </span>

            <button
              onClick={handleLikeToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-bold transition-all ${
                isLiked
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-455'
                  : 'bg-slate-950 border-slate-850 hover:border-rose-500/20 text-slate-500 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl font-bold transition-all ${
                isBookmarked
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-950 border-slate-850 hover:border-indigo-500/20 text-slate-500 hover:text-indigo-400'
              }`}
              title="Bookmark story"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wattpad style book page body container */}
      <div className={`border rounded-3xl p-6 md:p-12 shadow-xl relative overflow-hidden transition-all ${themeClasses[readerTheme]}`}>
        {/* Book gutter visual edge line */}
        <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-500/10 pointer-events-none" />
        <div className={`pl-6 ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
          {story.content && story.content.trim() !== '' ? (
            <div
              className={`${sizeClasses[fontSize]} selection:bg-indigo-500/30 selection:text-white`}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.content) }}
            />
          ) : (
            <div className="text-center py-20 text-slate-500 text-sm italic">
              No content exists for this story.
            </div>
          )}
        </div>
      </div>

      {/* Reader Comment Panel (Medium Review Style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="pb-4 border-b border-slate-805 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-md font-extrabold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
              <span>Reader Reviews & Discussion</span>
            </h3>
            <p className="text-xs text-slate-500">Share your thoughts or leave review feedback on this collaboration</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 font-bold">
            {story.comments?.length || 0} reviews
          </span>
        </div>

        {/* Create comment form */}
        <form onSubmit={handleCommentSubmit} className="space-y-3 pt-2">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
            <textarea
              placeholder={user ? "Write an public review or share your analysis..." : "Log in to post reviews..."}
              disabled={!user || submittingComment}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              maxLength={400}
              className="w-full bg-slate-950 outline-none text-slate-200 py-3 px-4 text-xs placeholder-slate-650 resize-none"
            />
          </div>
          {user && (
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Maximum 400 characters</span>
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:scale-[0.98] rounded-xl font-bold text-white shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {submittingComment ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Post Review</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Comments Listing */}
        {story.comments && story.comments.length > 0 ? (
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {[...story.comments].reverse().map((comment) => (
              <div key={comment._id} className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-indigo-400 font-bold">@{comment.username}</span>
                  <span className="text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600 text-xs italic">
            No reviews posted yet. Be the first to analyze this masterpiece!
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicStoryDetails;
