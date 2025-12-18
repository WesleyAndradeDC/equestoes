import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonCard({ className = '' }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
          <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 rounded-xl" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="flex justify-center gap-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

