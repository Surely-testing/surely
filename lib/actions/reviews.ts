// ============================================
// lib/actions/reviews.ts
// ============================================
'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { isValidEmail } from '@/utils/domainValidator';

export interface ReviewFormData {
  name: string;
  email: string;
  company?: string;
  role?: string;
  rating: number;
  review: string;
  consent: boolean;
  photoUrl?: string | null;
}

export async function submitReview(data: ReviewFormData) {
  try {
    // Validate required fields
    if (!data.name?.trim() || !data.email?.trim() || !data.review?.trim()) {
      return { error: 'Missing required fields' };
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return { error: 'Invalid email address' };
    }

    // Validate rating
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return { error: 'Rating must be between 1 and 5' };
    }

    // Validate consent
    if (!data.consent) {
      return { error: 'You must consent to display your review' };
    }

    // Use service role to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Insert review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        name: data.name.trim(),
        email: data.email.trim(),
        company: data.company?.trim() || null,
        role: data.role?.trim() || null,
        rating: data.rating,
        review: data.review.trim(),
        photo_url: data.photoUrl || null,
        status: 'pending', // Admin approval required
        featured: false
      })
      .select()
      .single();

    if (error) {
      console.error('Review submission error:', error);
      return { error: error.message };
    }

    // Revalidate home page to show new reviews (after admin approval)
    revalidatePath('/');

    return { data: review, success: true };
  } catch (error) {
    console.error('Review action error:', error);
    return { error: 'Failed to submit review. Please try again.' };
  }
}

// ============================================
// Database Schema (Run in Supabase SQL Editor)
// ============================================
/*
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow public to view approved reviews only
CREATE POLICY "reviews_public_select"
ON reviews
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Allow admins to manage reviews
CREATE POLICY "reviews_admin_all"
ON reviews
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Indexes
CREATE INDEX idx_reviews_status ON reviews(status, created_at DESC);
CREATE INDEX idx_reviews_featured ON reviews(featured, created_at DESC);
*/