import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-10 md:p-16 text-center max-w-xl mx-auto space-y-6 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
      
      {Icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 border border-slate-800 text-indigo-400 rounded-2xl shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-200">{title}</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">{description}</p>
      </div>

      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
