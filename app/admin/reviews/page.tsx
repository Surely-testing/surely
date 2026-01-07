// ============================================
// app/admin/reviews/page.tsx
// ============================================
'use client';

import React, { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { getAdminReviews, updateReviewStatus } from '@/lib/actions/admin';
import { Review } from '@/types/admin.types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    rating: ''
  });

  useEffect(() => {
    loadReviews();
  }, [page, filters]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const result = await getAdminReviews(
        page, 
        50, 
        {
          status: filters.status,
          rating: filters.rating ? parseInt(filters.rating) : undefined
        }
      );
      if (result.data) {
        setReviews(result.data.reviews);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string, status: string) => {
    try {
      await updateReviewStatus(reviewId, status);
      loadReviews();
    } catch (error) {
      console.error('Failed to update review status:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
        }`}
      />
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reviews</h1>
        <p className="text-slate-600">Manage customer reviews and testimonials</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center text-slate-500">
            No reviews found
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{review.name}</h3>
                    <p className="text-sm text-slate-500">{review.email}</p>
                    {review.company && (
                      <p className="text-sm text-slate-500">{review.company}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                    review.status === 'approved' ? 'bg-green-100 text-green-700' :
                    review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {review.status || 'pending'}
                  </span>
                  {review.featured && (
                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              <p className="text-slate-700 mb-4">{review.review}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                </p>
                {review.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(review.id, 'approved')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(review.id, 'rejected')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex items-center justify-between">
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
  );
}
