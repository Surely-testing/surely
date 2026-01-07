// ============================================
// app/admin/contacts/page.tsx
// ============================================
'use client'

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Mail, Search } from 'lucide-react';
import { getAdminContacts, updateContactStatus } from '@/lib/actions/admin';
import { ContactSales } from '@/types/admin.types';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => {
    loadContacts();
  }, [page, filters]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const result = await getAdminContacts(page, 50, filters);
      if (result.data) {
        setContacts(result.data.contacts);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (contactId: string, status: string) => {
    try {
      await updateContactStatus(contactId, status);
      loadContacts();
    } catch (error) {
      console.error('Failed to update contact status:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Contacts</h1>
        <p className="text-slate-600">Manage incoming sales inquiries</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Contacts</p>
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
              placeholder="Search contacts..."
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
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
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
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center text-slate-500">
            No contacts found
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  <p className="text-sm text-slate-500">{contact.email}</p>
                  {contact.phone && (
                    <p className="text-sm text-slate-500">{contact.phone}</p>
                  )}
                </div>
                <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                  contact.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                  contact.status === 'qualified' ? 'bg-purple-100 text-purple-700' :
                  contact.status === 'converted' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {contact.status || 'new'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-slate-500">Company:</span>
                  <span className="ml-2 text-slate-900">{contact.company_name}</span>
                </div>
                {contact.company_size && (
                  <div>
                    <span className="text-slate-500">Size:</span>
                    <span className="ml-2 text-slate-900">{contact.company_size}</span>
                  </div>
                )}
                {contact.hear_about && (
                  <div>
                    <span className="text-slate-500">Source:</span>
                    <span className="ml-2 text-slate-900">{contact.hear_about}</span>
                  </div>
                )}
                {contact.timezone && (
                  <div>
                    <span className="text-slate-500">Timezone:</span>
                    <span className="ml-2 text-slate-900">{contact.timezone}</span>
                  </div>
                )}
              </div>

              {contact.message && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">{contact.message}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : 'N/A'}
                </p>
                <select
                  value={contact.status || 'new'}
                  onChange={(e) => handleUpdateStatus(contact.id, e.target.value)}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
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