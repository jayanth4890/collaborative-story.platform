import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { sanitizeHtml } from '../utils/sanitize';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle,
  Plus,
  Send,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  XCircle,
  Search,
  Check,
  Sparkles,
  Shuffle,
  Wand2,
  Globe,
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useSocket } from '../context/SocketContext';

const StoryDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [invitations, setInvitations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submittingContrib, setSubmittingContrib] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Invite states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Forms states
  const [newContribution, setNewContribution] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState({});

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiResultType, setAiResultType] = useState('');
  const [aiResultSimulated, setAiResultSimulated] = useState(false);

  const isAuthor = story?.author?._id === user?._id;
  const isContributor = story?.contributors?.some((c) => c._id === user?._id);
  const isCollaborator = isAuthor || isContributor;
  const isCompleted = story?.status === 'completed';

  const isContributionEmpty = (html) => {
    if (!html) return true;
    const clean = html.replace(/<[^>]*>/g, '').trim();
    return clean === '';
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const formatContent = (content) => {
    if (!content) return '';
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      return content;
    }
    return content
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'blockquote',
    'list', 'bullet',
    'link'
  ];

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/suggest', {
        content: story.content || '',
      });
      setAiResult(res.data.suggestion);
      setAiResultType('Suggested Next Paragraph');
      setAiResultSimulated(!!res.data.simulated);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to suggest next paragraph', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiPlotTwist = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/plot-twist', {
        content: story.content || '',
      });
      setAiResult(res.data.twist);
      setAiResultType('Suggested Plot Twist');
      setAiResultSimulated(!!res.data.simulated);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to generate plot twist', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImprove = async () => {
    if (isContributionEmpty(newContribution)) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/improve', {
        text: newContribution,
      });
      setAiResult(res.data.improvedText);
      setAiResultType('Improved Draft');
      setAiResultSimulated(!!res.data.simulated);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to improve writing', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAppendAiContent = () => {
    if (aiResultType === 'Improved Draft') {
      setNewContribution(`<p>${aiResult}</p>`);
    } else {
      setNewContribution((prev) => {
        if (isContributionEmpty(prev)) {
          return `<p>${aiResult}</p>`;
        }
        return `${prev}<p>${aiResult}</p>`;
      });
    }
    setAiResult(null);
    showToast('AI content inserted into editor!', 'success');
  };

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/stories/${id}`);
      setStory(res.data);

      // Fetch contributions & invitations if collaborator
      const isUserAuthor = res.data.author._id === user?._id;
      const isUserContrib = res.data.contributors.some((c) => c._id === user?._id);

      if (isUserAuthor || isUserContrib) {
        const contribsRes = await api.get(`/contributions/story/${id}`);
        setContributions(contribsRes.data);

        if (isUserAuthor) {
          const invitesRes = await api.get(`/invitations/story/${id}`);
          setInvitations(invitesRes.data);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to load story details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, user, showToast]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket || !id) return;

    // Join story room
    socket.emit('join_story', id);

    const handleStoryUpdate = (data) => {
      showToast(data.message || 'Story manuscript updated!', 'success');
      fetchDetails();
    };

    const handleStoryCompleted = (data) => {
      showToast(data.message || 'This story has been marked as completed!', 'info');
      fetchDetails();
    };

    const handleContributionSubmitted = (data) => {
      // If we are the author, the global listener already showed a toast,
      // so we just refresh the reviews list silently.
      if (data.storyId === id) {
        fetchDetails();
      }
    };

    socket.on('story_updated', handleStoryUpdate);
    socket.on('story_completed', handleStoryCompleted);
    socket.on('contribution_submitted', handleContributionSubmitted);

    return () => {
      socket.emit('leave_story', id);
      socket.off('story_updated', handleStoryUpdate);
      socket.off('story_completed', handleStoryCompleted);
      socket.off('contribution_submitted', handleContributionSubmitted);
    };
  }, [socket, id]);

  // Handle contributor search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const res = await api.get(`/auth/users?search=${searchQuery}`);
          // Filter out users who are already contributors or the author
          const filtered = res.data.filter(
            (u) =>
              u._id !== story.author._id &&
              !story.contributors.some((c) => c._id === u._id)
          );
          setSearchResults(filtered);
        } catch (err) {
          console.error(err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, story]);

  // Export PDF
  const handleExportPDF = async () => {
    try {
      showToast('Preparing PDF download...', 'info');
      const res = await api.get(`/stories/${id}/export`, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const pdfLink = document.createElement('a');
      pdfLink.href = fileURL;
      pdfLink.setAttribute('download', `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_story.pdf`);
      document.body.appendChild(pdfLink);
      
      pdfLink.click();
      pdfLink.remove();
      showToast('PDF exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export story as PDF', 'error');
    }
  };

  // Complete story
  const handleCompleteStory = async () => {
    if (!window.confirm('Are you sure you want to mark this story as completed? This will lock it and prevent further changes.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.patch(`/stories/${id}/complete`);
      setStory(res.data);
      showToast('Story marked as completed. It is now read-only.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to complete story', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete story
  const handleDeleteStory = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this story and all its associated contributions/invitations? This action cannot be undone.')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/stories/${id}`);
      showToast('Story deleted successfully!', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete story', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Publish story
  const handlePublishStory = async () => {
    if (!window.confirm('Are you sure you want to publish this story? It will become publicly readable by everyone, including unregistered users.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.patch(`/stories/${id}/publish`);
      setStory(res.data);
      showToast('Story published successfully! It is now on the public feed.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to publish story', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Invite contributor
  const handleInvite = async (inviteeId) => {
    try {
      await api.post('/invitations', { storyId: story._id, inviteeId });
      showToast('Invitation sent successfully!', 'success');
      setSearchQuery('');
      setSearchResults([]);
      
      // Reload invitations list
      const invitesRes = await api.get(`/invitations/story/${id}`);
      setInvitations(invitesRes.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Invitation failed', 'error');
    }
  };

  // Submit contribution
  const handleSubmitContribution = async (e) => {
    e.preventDefault();
    if (isContributionEmpty(newContribution)) {
      return showToast('Contribution text cannot be empty', 'warning');
    }

    setSubmittingContrib(true);
    try {
      const res = await api.post('/contributions', {
        storyId: story._id,
        content: newContribution,
      });
      showToast('Contribution submitted for review!', 'success');
      setNewContribution('');
      
      // Reload contributions list
      const contribsRes = await api.get(`/contributions/story/${id}`);
      setContributions(contribsRes.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmittingContrib(false);
    }
  };

  // Review contribution (Approve / Reject)
  const handleReview = async (contribId, reviewStatus) => {
    setActionLoading(true);
    try {
      const feedback = reviewFeedback[contribId] || '';
      await api.patch(`/contributions/${contribId}/review`, {
        status: reviewStatus,
        feedback,
      });

      showToast(`Contribution ${reviewStatus} successfully!`, 'success');
      
      // Clean feedback text
      setReviewFeedback((prev) => {
        const next = { ...prev };
        delete next[contribId];
        return next;
      });

      // Reload all details (appends content automatically to story if approved)
      await fetchDetails();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Review response failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackChange = (contribId, text) => {
    setReviewFeedback((prev) => ({ ...prev, [contribId]: text }));
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Story Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">The story draft you are looking for does not exist or has been removed.</p>
        <Link to="/" className="text-indigo-400 font-semibold hover:underline">Return to feed</Link>
      </div>
    );
  }

  // Filter contributions by status
  const pendingContributions = contributions.filter((c) => c.status === 'pending');
  const pastContributions = contributions.filter((c) => c.status !== 'pending');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="space-y-3">
          <Link
            to={isCollaborator ? '/dashboard' : '/'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {isCollaborator ? 'Dashboard' : 'Feed'}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 leading-tight">
              {story.title}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold border ${
                isCompleted
                  ? 'bg-slate-950 text-slate-400 border-slate-800'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isCompleted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {story.status.toUpperCase()}
            </span>
            {story.isPublic && (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold border bg-indigo-950/40 text-indigo-400 border-indigo-500/20">
                <Globe className="w-3.5 h-3.5" />
                <span>PUBLISHED</span>
              </span>
            )}
          </div>

          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            {story.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <span>
              Author:{' '}
              <span className="text-indigo-400 font-bold">{story.author?.username}</span>
            </span>
            {story.contributors?.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {story.contributors.map((c) => c.username).join(', ')}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          {user?.role === 'admin' && (
            <button
              onClick={handleDeleteStory}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 border border-rose-500/20 hover:border-rose-500/60 hover:bg-rose-500/5 text-xs font-bold rounded-xl text-rose-450 hover:text-rose-400 transition-all duration-200"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Delete Story</span>
            </button>
          )}

          {isAuthor && !isCompleted && (
            <button
              onClick={handleCompleteStory}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/30 hover:bg-amber-500/5 text-xs font-bold rounded-xl text-slate-300 hover:text-amber-400 transition-all duration-200"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </button>
          )}

          {isAuthor && isCompleted && !story.isPublic && (
            <button
              onClick={handlePublishStory}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-650 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] text-xs font-bold rounded-xl text-white shadow-lg transition-all duration-200"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish Story</span>
            </button>
          )}

          {(isCompleted || isCollaborator) && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl text-white shadow-lg shadow-indigo-600/10 transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Story Text Container (Take 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {isCompleted && (
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-amber-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Story Completed</p>
                <p className="text-slate-400">This work has been marked completed by the author. It is now read-only and no further sections or contributions can be made.</p>
              </div>
            </div>
          )}

          {/* Styled Book Page */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
            {/* Margins/Visual Book Borders */}
            <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-800/60 pointer-events-none" />
            <div className="pl-6 font-serif">
              {story.content && story.content.trim() !== '' ? (
                <div
                  className="text-slate-200 text-base md:text-lg selection:bg-indigo-600/40 rich-text"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatContent(story.content)) }}
                />
              ) : (
                <div className="text-center py-20 text-slate-500 text-sm italic">
                  No pages have been written yet. Contributions are welcome!
                </div>
              )}
            </div>
          </div>

          {/* Submission Panel (Only for ongoing stories when user is a contributor or author) */}
          {!isCompleted && isCollaborator && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 relative overflow-hidden">
              {/* AI Loading overlay */}
              {aiLoading && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center z-10 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl py-3 px-5 flex items-center gap-3 shadow-2xl">
                    <Spinner size="sm" />
                    <span className="text-xs font-semibold text-slate-300">Consulting AI Story Companion...</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div>
                  <h3 className="text-md font-bold text-slate-200">Submit Next Section</h3>
                  <p className="text-xs text-slate-400">Draft your paragraph or continuation below. The author will review it before appending it to the story.</p>
                </div>
                
                {/* AI Assistant Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/20 hover:bg-indigo-950/50 border border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-300 transition-colors disabled:opacity-50"
                    title="Suggest Next Paragraph"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Suggest Next</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAiPlotTwist}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/20 hover:bg-indigo-950/50 border border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-300 transition-colors disabled:opacity-50"
                    title="Brainstorm Plot Twist"
                  >
                    <Shuffle className="w-3 h-3 text-indigo-400" />
                    <span>Plot Twist</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAiImprove}
                    disabled={aiLoading || isContributionEmpty(newContribution)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/20 hover:bg-indigo-950/50 border border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-300 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    title="Improve Draft Grammar & Style"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Improve Draft</span>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmitContribution} className="space-y-4 pt-2">
                <div className="rounded-2xl overflow-hidden border border-slate-800 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all duration-200">
                  <ReactQuill
                    theme="snow"
                    value={newContribution}
                    onChange={setNewContribution}
                    placeholder="Continue the adventure here..."
                    modules={modules}
                    formats={formats}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingContrib || isContributionEmpty(newContribution)}
                    className="inline-flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-2xl text-xs font-semibold text-white shadow-xl shadow-indigo-600/15 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {submittingContrib ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Section</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Panel (Actions, Review, Invites, etc.) */}
        <div className="space-y-6">
          {/* Author Panel - Invites */}
          {isAuthor && !isCompleted && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-md font-bold text-slate-200">Invite Co-Writers</h3>
                <p className="text-xs text-slate-400">Search for platform members to invite as contributors</p>
              </div>

              {/* User search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>

              {/* Search results */}
              {searching ? (
                <div className="py-2 text-center text-xs text-slate-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-40 overflow-y-auto">
                  {searchResults.map((userRes) => (
                    <div key={userRes._id} className="p-3 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-300 truncate">{userRes.username}</p>
                        <p className="text-[10px] text-slate-500 truncate">{userRes.email}</p>
                      </div>
                      <button
                        onClick={() => handleInvite(userRes._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Invite</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-2 text-center text-xs text-slate-500">No users found</div>
              ) : null}

              {/* Pending Invitations list */}
              {invitations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <span className="text-xs font-bold text-slate-400 block uppercase mb-2">Sent Invitations</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {invitations.map((invite) => (
                      <div key={invite._id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-300 truncate">{invite.invitee?.username}</p>
                          <p className="text-[10px] text-slate-500 truncate">{invite.invitee?.email}</p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            invite.status === 'pending'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                              : invite.status === 'accepted'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {invite.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Author Panel - Pending Reviews */}
          {isAuthor && !isCompleted && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-md font-bold text-slate-200">Review Submissions</h3>
                <p className="text-xs text-slate-400">Read and approve contributor drafts to append them</p>
              </div>

              {pendingContributions.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {pendingContributions.map((contrib) => (
                    <div key={contrib._id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-indigo-400 font-bold">@{contrib.contributor?.username}</span>
                        <span className="text-slate-500">Pending</span>
                      </div>
                      
                      <div
                        className="text-xs text-slate-300 rich-text italic border-l-2 border-indigo-500/50 pl-3 py-1 bg-slate-900/40 rounded-r-lg"
                        dangerouslySetInnerHTML={{ __html: formatContent(contrib.content) }}
                      />

                      <div className="space-y-2 border-t border-slate-800/80 pt-2">
                        <input
                          type="text"
                          placeholder="Feedback/Notes (optional)..."
                          value={reviewFeedback[contrib._id] || ''}
                          onChange={(e) => handleFeedbackChange(contrib._id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/40"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleReview(contrib._id, 'rejected')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold text-rose-400 rounded-lg transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                          <button
                            onClick={() => handleReview(contrib._id, 'approved')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  No pending drafts to review.
                </div>
              )}
            </div>
          )}

          {/* Contributor Log (Only visible to collaborators) */}
          {isCollaborator && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-md font-bold text-slate-200">Submission Logs</h3>
                <p className="text-xs text-slate-400">History of drafted sections for this story</p>
              </div>

              {pastContributions.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {pastContributions.map((contrib) => (
                    <div key={contrib._id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400 font-semibold">@{contrib.contributor?.username}</span>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            contrib.status === 'approved'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {contrib.status}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 leading-relaxed line-clamp-2 italic font-serif">
                        "{stripHtml(contrib.content)}"
                      </p>

                      {contrib.feedback && (
                        <div className="bg-slate-900 border-l border-indigo-500 p-2 rounded-r">
                          <span className="font-bold text-[9px] text-slate-500 block">Notes:</span>
                          <span className="text-[10px] text-slate-400 italic">"{contrib.feedback}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  No past contributions yet.
                </div>
              )}
            </div>
          )}
        </div>

      {/* AI Suggestion Response Modal */}
      {aiResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{aiResultType}</h3>
                <p className="text-xs text-slate-400">Generated by OpenAI Story Companion</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 max-h-80 overflow-y-auto font-serif text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {aiResult}
            </div>

            {aiResultSimulated && (
              <div className="text-[10px] text-amber-500 italic bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                * Note: Running in Simulation Mode. Configure OPENAI_API_KEY in the backend to fetch production completions.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setAiResult(null)}
                className="px-4 py-2.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleAppendAiContent}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{aiResultType === 'Improved Draft' ? 'Replace Draft' : 'Append to Editor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default StoryDetails;
