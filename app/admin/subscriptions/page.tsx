// ============================================
// app/admin/subscriptions/page.tsx
// ============================================
'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAdminSubscriptions } from '@/lib/actions/admin';
import { Subscription } from '@/types/admin.types';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => {
    loadSubscriptions();
  }, [page, filters]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await getAdminSubscriptions(page, 50, filters);
      if (result.data) {
        setSubscriptions(result.data.subscriptions);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscriptions</h1>
        <p className="text-slate-600">Manage all platform subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Subscriptions</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="canceled">Canceled</option>
            <option value="past_due">Past Due</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Billing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No subscriptions found</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{sub.user_name}</p>
                        <p className="text-sm text-slate-500">{sub.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{sub.tier_name || 'Free'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                        sub.status === 'canceled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{sub.billing_cycle || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}