import React, { useState } from 'react';
import { Mail, Check, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const InvitationCard = ({ invitation, onResponse }) => {
  const { _id, story, inviter, status } = invitation;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await api.patch(`/invitations/${_id}`, { status: action });
      showToast(`Invitation ${action} successfully!`, 'success');
      onResponse();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPending = status === 'pending';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Mail className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            INVITATION FROM <span className="text-indigo-400 font-bold">{inviter?.username}</span>
          </span>
        </div>

        <h3 className="text-md font-bold text-slate-200 truncate mb-1">
          {story?.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-1">
          {story?.description}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isPending ? (
          <>
            <button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-rose-500/30 text-xs font-medium rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
            <button
              onClick={() => handleAction('accepted')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white shadow-lg shadow-indigo-500/10 transition-all duration-200 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept</span>
            </button>
          </>
        ) : (
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
              status === 'accepted'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
            }`}
          >
            {status === 'accepted' ? 'Accepted' : 'Declined'}
          </span>
        )}
      </div>
    </div>
  );
};

export default InvitationCard;
