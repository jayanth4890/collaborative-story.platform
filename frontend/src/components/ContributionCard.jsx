import React from 'react';
import { BookOpen, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContributionCard = ({ contribution }) => {
  const { story, content, status, feedback, createdAt } = contribution;

  const getStatusDisplay = () => {
    switch (status) {
      case 'approved':
        return {
          color: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          label: 'Approved',
        };
      case 'rejected':
        return {
          color: 'bg-rose-950/40 text-rose-400 border-rose-500/20',
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: 'Rejected',
        };
      case 'pending':
      default:
        return {
          color: 'bg-amber-950/40 text-amber-400 border-amber-500/20',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Under Review',
        };
    }
  };

  const statusInfo = getStatusDisplay();
  const dateFormatted = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300">
      <div>
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              SUBMITTED FOR:{' '}
              <span className="text-indigo-400 font-bold">{story?.title || 'Unknown Story'}</span>
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">{dateFormatted}</span>
        </div>

        {/* Contribution Snippet */}
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 mb-3">
          <p className="text-sm text-slate-300 italic leading-relaxed whitespace-pre-wrap line-clamp-3">
            "{content}"
          </p>
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className="bg-slate-950 border-l-2 border-indigo-500 p-3 rounded-r-xl">
            <span className="text-xs font-bold text-slate-400 block mb-0.5">Author Feedback:</span>
            <p className="text-xs text-slate-400 leading-relaxed italic">"{feedback}"</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
        >
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </span>

        {story && (
          <Link
            to={`/story/${story._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View Story</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ContributionCard;
