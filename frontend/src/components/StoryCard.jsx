import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Lock, Unlock, ArrowRight } from 'lucide-react';

const StoryCard = ({ story }) => {
  const { _id, title, description, author, status, contributors } = story;

  const isCompleted = status === 'completed';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between group">
      <div>
        {/* Top Info */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
              isCompleted
                ? 'bg-slate-950 text-slate-400 border-slate-800'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isCompleted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {status.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            By <span className="text-indigo-400 font-semibold">{author?.username}</span>
          </span>
        </div>

        {/* Title & Desc */}
        <h3 className="text-lg font-bold text-slate-100 mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{contributors?.length || 0} Contributor{contributors?.length !== 1 ? 's' : ''}</span>
        </div>

        <Link
          to={`/story/${_id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Read & Write</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default StoryCard;
