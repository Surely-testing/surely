'use client';

import React, { useState } from 'react';
import { Send, Building2, User, Mail, Phone, Globe, MessageSquare, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { isCommonEmailProvider, isValidEmail } from '@/utils/domainValidator';
import { submitContactSales } from '@/lib/actions/contact-sales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';

export default function ContactSalesForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companySize: '',
    timezone: '',
    hearAbout: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1,000 employees' },
    { value: '1000+', label: '1,000+ employees' }
  ];

  const timezones = [
    { value: 'Americas', label: 'Americas (EST/PST/CST)' },
    { value: 'Europe', label: 'Europe (GMT/CET)' },
    { value: 'Asia', label: 'Asia (IST/SGT/JST)' },
    { value: 'Africa', label: 'Africa (CAT/EAT)' },
    { value: 'Oceania', label: 'Oceania (AEST/NZST)' }
  ];

  const hearAboutOptions = [
    { value: 'search', label: 'Search Engine' },
    { value: 'social', label: 'Social Media' },
    { value: 'referral', label: 'Referral' },
    { value: 'blog', label: 'Blog/Article' },
    { value: 'event', label: 'Event/Conference' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDropdownSelect = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [emailWarning, setEmailWarning] = useState(false);

  const handleEmailChange = (e: { target: { value: any; }; }) => {
    const email = e.target.value;
    setFormData(prev => ({
      ...prev,
      email
    }));
    
    // Show warning for personal emails (only if email looks complete)
    if (email && email.includes('@') && email.includes('.')) {
      if (isValidEmail(email) && isCommonEmailProvider(email)) {
        setEmailWarning(true);
      } else {
        setEmailWarning(false);
      }
    } else {
      setEmailWarning(false);
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Optional field
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Must be between 10-15 digits
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Business email is required');
      return;
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error('Please enter a valid phone number (10-15 digits)');
      return;
    }

    setLoading(true);
    
    try {
      const result = await submitContactSales(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success('Inquiry submitted successfully! We\'ll be in touch soon.');
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit inquiry. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
          <p className="text-slate-600 mb-6">
            We've received your inquiry. Our sales team will reach out to you within 24 hours.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                companyName: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                companySize: '',
                timezone: '',
                hearAbout: '',
                message: ''
              });
            }}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Contact Enterprise Sales
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Interested in our Enterprise plan? Fill out the form below and our team will get back to you shortly.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>For support inquiries, please use our support portal</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Acme Corporation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="john.doe@company.com"
                />
              </div>
              {emailWarning && (
                <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Consider using your company email for faster processing
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Size
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-left">
                  {formData.companySize ? companySizes.find(s => s.value === formData.companySize)?.label : 'Please Select'}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {companySizes.map(size => (
                    <DropdownMenuItem
                      key={size.value}
                      onClick={() => handleDropdownSelect('companySize', size.value)}
                    >
                      {size.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Region / Timezone
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-left">
                    {formData.timezone ? timezones.find(t => t.value === formData.timezone)?.label : 'Please Select'}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {timezones.map(tz => (
                      <DropdownMenuItem
                        key={tz.value}
                        onClick={() => handleDropdownSelect('timezone', tz.value)}
                      >
                        {tz.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How did you hear about us?
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-left">
                  {formData.hearAbout ? hearAboutOptions.find(o => o.value === formData.hearAbout)?.label : 'Please Select'}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {hearAboutOptions.map(option => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleDropdownSelect('hearAbout', option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Details
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Tell us about your needs, team size, or any specific requirements..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Inquiry
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-4">
              By submitting this form, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Need immediate assistance? Email us at <a href="mailto:sales@testsurely.com" className="text-blue-600 hover:underline">sales@testsurely.com</a></p>
        </div>
      </div>
    </div>
  );
}