'use client';

import React, { useState } from 'react';
import { Star, Send, CheckCircle2, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { submitReview } from '@/lib/actions/reviews';
import Image from 'next/image';

export default function SubmitReviewPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    review: '',
    consent: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.review) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!formData.consent) {
      toast.error('Please consent to display your review');
      return;
    }

    setLoading(true);

    try {
      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        // TODO: Upload to Supabase Storage
        // For now, we'll skip this and add it in the next iteration
        toast.info('Photo upload will be implemented soon');
      }

      const result = await submitReview({
        ...formData,
        rating,
        photoUrl
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Review submitted! We\'ll review and publish it soon.');
      setSubmitted(true);
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
          <p className="text-slate-600 mb-6">
            Your review has been submitted for approval. We'll publish it on our website soon!
          </p>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full btn-primary text-center"
            >
              Back to Home
            </a>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: '',
                  email: '',
                  company: '',
                  role: '',
                  review: '',
                  consent: false
                });
                setRating(0);
                setPhotoPreview(null);
                setPhotoFile(null);
              }}
              className="w-full px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Submit Another Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Share Your Experience ⭐
          </h1>
          <p className="text-lg text-slate-600">
            Help others by sharing your experience with Assura
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-3 text-sm text-slate-600 self-center">
                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </span>
                )}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Photo (Optional)
              </label>
              {photoPreview ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-300">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={removePhoto}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-full cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Max 5MB. JPG, PNG, or WebP
              </p>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Company & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Acme Inc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role (Optional)
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="QA Engineer"
                />
              </div>
            </div>

            {/* Review */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                name="review"
                value={formData.review}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                placeholder="Share your experience with Assura. What features do you love? How has it helped your team?"
              />
              <p className="text-xs text-slate-500 mt-2">
                Minimum 50 characters
              </p>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500"
              />
              <label className="text-sm text-slate-700">
                <span className="font-medium">I consent to display my review</span> (name, photo, company, role, and review text) on the Assura website, marketing materials, and social media channels. I understand that my email will not be publicly displayed.
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <a
                href="/"
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </a>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Your review will be reviewed by our team before being published on our website.</p>
        </div>
      </div>
    </div>
  );
}