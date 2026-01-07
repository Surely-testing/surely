// ============================================
// app/admin/page.tsx (WITH REFRESH BUTTON)
// ============================================
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  Clock,
  Star,
  Mail,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getAdminDashboardStats } from '@/lib/actions/admin';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/types/admin.types';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getAdminDashboardStats();
      if (result.data) {
        setStats(result.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadStats(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Failed to load dashboard data</p>
          <button
            onClick={() => loadStats()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Refresh */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
          <p className="text-slate-600">Monitor your platform's key metrics and activity</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium text-slate-700">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconColor="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={UserCheck}
          iconColor="green"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(stats.monthlyRecurringRevenue)}
          icon={DollarSign}
          iconColor="orange"
        />
        <StatCard
          title="Trial Subscriptions"
          value={stats.trialingSubscriptions}
          icon={Clock}
          iconColor="purple"
        />
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Reviews */}
        <Link href="/admin/reviews?status=pending">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Pending Reviews</h3>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingReviews}</p>
              </div>
            </div>
            <span className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Review now →
            </span>
          </div>
        </Link>

        {/* Pending Contacts */}
        <Link href="/admin/contacts?status=new">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Pending Contacts</h3>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingContacts}</p>
              </div>
            </div>
            <span className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              View contacts →
            </span>
          </div>
        </Link>

        {/* Total Revenue */}
        <Link href="/admin/payments">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Total Revenue</h3>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
            <span className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              View payments →
            </span>
          </div>
        </Link>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
          </div>
          <div className="p-6">
            {stats.recentUsers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No users yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      user.account_type === 'organization' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.account_type || 'individual'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link 
              href="/admin/users" 
              className="block text-center mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all users →
            </Link>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Subscriptions</h2>
          </div>
          <div className="p-6">
            {stats.recentSubscriptions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No subscriptions yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{sub.user_email}</p>
                      <p className="text-sm text-slate-500">{sub.tier_name || 'No tier'}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      sub.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : sub.status === 'trialing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link 
              href="/admin/subscriptions" 
              className="block text-center mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all subscriptions →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Payments</h2>
        </div>
        {stats.recentPayments.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No payments yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-slate-900">{payment.user_email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-900">{formatCurrency(payment.amount / 100)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          payment.status === 'succeeded' 
                            ? 'bg-green-100 text-green-700' 
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200">
              <Link 
                href="/admin/payments" 
                className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View all payments →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}