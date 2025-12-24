
// ============================================
// lib/recording/network-filter.ts
// Filter and search network requests
// ============================================

import { NetworkLog } from '@/types/recording.types';

export type NetworkFilterCriteria = {
  search?: string;
  method?: string;
  statusRange?: '2xx' | '3xx' | '4xx' | '5xx' | 'failed' | 'all';
  type?: NetworkLog['type'] | 'all';
  minDuration?: number;
  maxDuration?: number;
  hasError?: boolean;
};

export class NetworkFilter {
  static filter(logs: NetworkLog[], criteria: NetworkFilterCriteria): NetworkLog[] {
    return logs.filter(log => {
      // Search filter
      if (criteria.search) {
        const search = criteria.search.toLowerCase();
        const matchesUrl = log.url.toLowerCase().includes(search);
        const matchesMethod = log.method.toLowerCase().includes(search);
        const matchesStatus = log.status?.toString().includes(search);
        
        if (!matchesUrl && !matchesMethod && !matchesStatus) {
          return false;
        }
      }

      // Method filter
      if (criteria.method && criteria.method !== 'all') {
        if (log.method !== criteria.method) {
          return false;
        }
      }

      // Status range filter
      if (criteria.statusRange && criteria.statusRange !== 'all') {
        const status = log.status || 0;
        
        switch (criteria.statusRange) {
          case '2xx':
            if (status < 200 || status >= 300) return false;
            break;
          case '3xx':
            if (status < 300 || status >= 400) return false;
            break;
          case '4xx':
            if (status < 400 || status >= 500) return false;
            break;
          case '5xx':
            if (status < 500) return false;
            break;
          case 'failed':
            if (status !== 0 && !log.error) return false;
            break;
        }
      }

      // Type filter
      if (criteria.type && criteria.type !== 'all') {
        if (log.type !== criteria.type) {
          return false;
        }
      }

      // Duration filter
      if (criteria.minDuration !== undefined && log.duration !== undefined) {
        if (log.duration < criteria.minDuration) {
          return false;
        }
      }

      if (criteria.maxDuration !== undefined && log.duration !== undefined) {
        if (log.duration > criteria.maxDuration) {
          return false;
        }
      }

      // Error filter
      if (criteria.hasError !== undefined) {
        const hasError = !!log.error || (log.status || 0) >= 400;
        if (hasError !== criteria.hasError) {
          return false;
        }
      }

      return true;
    });
  }

  static sort(
    logs: NetworkLog[],
    sortBy: 'timestamp' | 'duration' | 'status' | 'size',
    order: 'asc' | 'desc' = 'desc'
  ): NetworkLog[] {
    const sorted = [...logs].sort((a, b) => {
      let compareA: number = 0;
      let compareB: number = 0;

      switch (sortBy) {
        case 'timestamp':
          compareA = a.timestamp;
          compareB = b.timestamp;
          break;
        case 'duration':
          compareA = a.duration || 0;
          compareB = b.duration || 0;
          break;
        case 'status':
          compareA = a.status || 0;
          compareB = b.status || 0;
          break;
        case 'size':
          compareA = a.size || 0;
          compareB = b.size || 0;
          break;
      }

      return order === 'asc' ? compareA - compareB : compareB - compareA;
    });

    return sorted;
  }

  static getUniqueMethods(logs: NetworkLog[]): string[] {
    const methods = new Set(logs.map(log => log.method));
    return Array.from(methods).sort();
  }

  static getUniqueTypes(logs: NetworkLog[]): NetworkLog['type'][] {
    const types = new Set(logs.map(log => log.type));
    return Array.from(types).sort();
  }

  static getStatusCodeDistribution(logs: NetworkLog[]): Record<string, number> {
    const distribution: Record<string, number> = {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0,
      'failed': 0,
    };

    logs.forEach(log => {
      const status = log.status || 0;
      
      if (status >= 200 && status < 300) {
        distribution['2xx']++;
      } else if (status >= 300 && status < 400) {
        distribution['3xx']++;
      } else if (status >= 400 && status < 500) {
        distribution['4xx']++;
      } else if (status >= 500) {
        distribution['5xx']++;
      } else {
        distribution['failed']++;
      }
    });

    return distribution;
  }

  static calculateStats(logs: NetworkLog[]) {
    if (logs.length === 0) {
      return null;
    }

    const durations = logs.map(log => log.duration || 0).filter(d => d > 0);
    const sizes = logs.map(log => log.size || 0).filter(s => s > 0);

    return {
      totalRequests: logs.length,
      avgDuration: durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      totalSize: sizes.reduce((sum, s) => sum + s, 0),
      avgSize: sizes.length > 0
        ? sizes.reduce((sum, s) => sum + s, 0) / sizes.length
        : 0,
    };
  }
}