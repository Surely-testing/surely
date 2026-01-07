// ============================================
// components/admin/StatCard.tsx
// ============================================
'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600'
};

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor,
  change 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[iconColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`text-sm font-medium ${
            change.trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.trend === 'up' ? '↑' : '↓'} {Math.abs(change.value)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
      <p className="text-sm text-slate-600">{title}</p>
    </div>
  );
}