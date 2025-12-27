'use client'

import React, { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Clock, Briefcase, DollarSign, Users, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface JobType {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    salary: string;
    team: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
    created_at?: string;
}

const CareerPage = () => {
    const [selectedJob, setSelectedJob] = useState<JobType | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
    const [jobs, setJobs] = useState<JobType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('careers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const departments = ["All", ...Array.from(new Set(jobs.map(job => job.department)))];

    const filteredJobs = selectedDepartment === "All" 
        ? jobs 
        : jobs.filter(job => job.department === selectedDepartment);

    if (selectedJob) {
        return (
            <div className="min-h-screen bg-background transition-colors duration-200">
                {/* Header */}
                <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button
                            onClick={() => setSelectedJob(null)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Careers</span>
                        </button>
                    </div>
                </header>

                {/* Job Detail */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-theme-lg">
                        {/* Header */}
                        <div className="mb-8">
                            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full text-sm font-medium mb-4">
                                {selectedJob.department}
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                {selectedJob.title}
                            </h1>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {selectedJob.description}
                            </p>
                        </div>

                        {/* Job Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 pb-8 border-b border-border">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span>{selectedJob.location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Clock className="w-5 h-5 text-primary" />
                                <span>{selectedJob.type}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <DollarSign className="w-5 h-5 text-primary" />
                                <span>{selectedJob.salary}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Users className="w-5 h-5 text-primary" />
                                <span>{selectedJob.team}</span>
                            </div>
                        </div>

                        {/* Responsibilities */}
                        {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">Responsibilities</h2>
                                <ul className="space-y-2">
                                    {selectedJob.responsibilities.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Requirements */}
                        {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">Requirements</h2>
                                <ul className="space-y-2">
                                    {selectedJob.requirements.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Benefits */}
                        {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">Benefits</h2>
                                <ul className="space-y-2">
                                    {selectedJob.benefits.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Apply Button */}
                        <div className="pt-6 border-t border-border">
                            <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                Apply for this Position
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-200">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground animate-in slide-in-from-left duration-500">
                            Career Opportunities
                        </h1>
                        <p className="text-muted-foreground mt-2 animate-in slide-in-from-left duration-500 delay-100">
                            Join our team and help shape the future of quality assurance
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    // Loading State
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading career opportunities...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                            <Briefcase className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">No Open Positions</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            We don't have any open positions at the moment, but we're always looking for talented individuals. Check back soon or send us your resume!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Department Filter */}
                        {departments.length > 1 && (
                            <div className="mb-8">
                                <div className="flex flex-wrap gap-3">
                                    {departments.map((dept) => (
                                        <button
                                            key={dept}
                                            onClick={() => setSelectedDepartment(dept)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                selectedDepartment === dept
                                                    ? "bg-primary text-white shadow-lg"
                                                    : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                                            }`}
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Job Listings */}
                        {filteredJobs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredJobs.map((job, index) => (
                                    <div
                                        key={job.id}
                                        className="bg-card border border-border rounded-xl p-6 hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in slide-in-from-bottom duration-500"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                        onClick={() => setSelectedJob(job)}
                                    >
                                        {/* Department Badge */}
                                        <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full text-xs font-medium mb-3">
                                            {job.department}
                                        </span>

                                        {/* Job Title */}
                                        <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                                            {job.title}
                                        </h3>

                                        {/* Job Details */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span>{job.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Briefcase className="w-4 h-4 text-primary" />
                                                <span>{job.type}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <DollarSign className="w-4 h-4 text-primary" />
                                                <span>{job.salary}</span>
                                            </div>
                                        </div>

                                        {/* View Details */}
                                        <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                                            <span>View Details</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // No Results for Filter
                            <div className="text-center py-16">
                                <p className="text-muted-foreground text-lg">
                                    No positions available in this department at the moment.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default CareerPage;