// ============================================
// components/dashboard/StatsCard.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  badges?: Array<{
    label: string;
    variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';  // ✅ Fixed to match Badge
  }>;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  badges,
  trend,
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>

      {badges && badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <Badge key={index} variant={badge.variant}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}

      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <span className={trend.direction === 'up' ? 'text-success' : 'text-error'}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </Card>
  );
}