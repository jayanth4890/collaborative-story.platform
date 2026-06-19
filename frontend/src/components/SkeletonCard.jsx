import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-5 animate-pulse">
      {/* Card Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-20 bg-slate-800 rounded-full" />
        <div className="h-2.5 w-16 bg-slate-800 rounded-full" />
      </div>

      {/* Title & Description Skeletons */}
      <div className="space-y-3">
        <div className="h-4.5 w-3/4 bg-slate-700/80 rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-slate-800 rounded-md" />
          <div className="h-3 w-5/6 bg-slate-800 rounded-md" />
          <div className="h-3 w-2/3 bg-slate-800 rounded-md" />
        </div>
      </div>

      {/* Card Footer Skeleton */}
      <div className="pt-4 border-t border-slate-800/60 mt-6 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="h-3 w-10 bg-slate-800 rounded-full" />
          <div className="h-3 w-10 bg-slate-800 rounded-full" />
        </div>
        <div className="h-7 w-20 bg-slate-805 rounded-xl" />
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};
