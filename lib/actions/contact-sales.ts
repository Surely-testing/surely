// ============================================
// lib/actions/contact-sales.ts
// ============================================
'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { isCommonEmailProvider, isValidEmail } from '@/utils/domainValidator';

export interface ContactSalesFormData {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companySize?: string;
  timezone?: string;
  hearAbout?: string;
  message?: string;
}

export async function submitContactSales(data: ContactSalesFormData) {
  try {
    // Validate required fields
    if (!data.companyName?.trim() || !data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim()) {
      return { error: 'Missing required fields' };
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return { error: 'Invalid email address' };
    }

    // Use service role client to bypass RLS for public form submission
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

    // Insert into database
    const { data: contact, error } = await supabase
      .from('contact_sales')
      .insert({
        company_name: data.companyName,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        company_size: data.companySize || null,
        timezone: data.timezone || null,
        hear_about: data.hearAbout || null,
        message: data.message || null,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Contact sales submission error:', error);
      return { error: error.message };
    }

    // TODO: Send email notification to sales team
    // await sendSalesNotification(contact);

    // Revalidate admin pages if needed
    revalidatePath('/admin/contacts');

    return { data: contact, success: true };
  } catch (error) {
    console.error('Contact sales action error:', error);
    return { error: 'Failed to submit inquiry. Please try again.' };
  }
}