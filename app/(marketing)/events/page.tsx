'use client'

import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, MapPin, Clock, Users, ChevronRight, Presentation, Video, Handshake, GraduationCap, Loader2 } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface EventType {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: string;
    type: string;
    description: string;
    status: 'upcoming' | 'past';
    created_at?: string;
}

const EventsPage = () => {
    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'conference':
                return Presentation;
            case 'webinar':
                return Video;
            case 'meetup':
                return Handshake;
            case 'workshop':
                return GraduationCap;
            default:
                return Calendar;
        }
    };

    const upcomingEvents = events.filter(e => e.status === 'upcoming');
    const pastEvents = events.filter(e => e.status === 'past');

    if (selectedEvent) {
        const IconComponent = getEventIcon(selectedEvent.type);

        return (
            <div className="min-h-screen bg-background transition-colors duration-200">
                {/* Header */}
                <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Events</span>
                        </button>
                    </div>
                </header>

                {/* Event Detail */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-theme-lg">
                        {/* Event Icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                            <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        
                        {/* Event Type Badge */}
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full text-sm font-medium mb-4">
                            {selectedEvent.type}
                        </span>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 animate-in slide-in-from-bottom duration-500">
                            {selectedEvent.title}
                        </h1>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span>{selectedEvent.date}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Clock className="w-5 h-5 text-primary" />
                                <span>{selectedEvent.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span>{selectedEvent.location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Users className="w-5 h-5 text-primary" />
                                <span>{selectedEvent.attendees} Expected</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="border-t border-border pt-6">
                            <h2 className="text-xl font-semibold text-foreground mb-3">About This Event</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {selectedEvent.description}
                            </p>
                        </div>

                        {/* Action Button */}
                        {selectedEvent.status === "upcoming" && (
                            <div className="mt-8">
                                <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    Register Now
                                </button>
                            </div>
                        )}
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
                            Events
                        </h1>
                        <p className="text-muted-foreground mt-2 animate-in slide-in-from-left duration-500 delay-100">
                            Join us at upcoming events and webinars
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
                        <p className="text-muted-foreground">Loading events...</p>
                    </div>
                ) : events.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">No Events Yet</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            We're working on exciting events for you. Check back soon for upcoming workshops, webinars, and conferences!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Upcoming Events */}
                        {upcomingEvents.length > 0 && (
                            <section className="mb-16">
                                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
                                    Upcoming Events
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEvents.map((event, index) => {
                                        const IconComponent = getEventIcon(event.type);
                                        return (
                                            <div
                                                key={event.id}
                                                className="bg-card border border-border rounded-xl p-6 hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in slide-in-from-bottom duration-500"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                                onClick={() => setSelectedEvent(event)}
                                            >
                                                {/* Event Icon */}
                                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <IconComponent className="w-6 h-6 text-primary" />
                                                </div>
                                                
                                                {/* Type Badge */}
                                                <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full text-xs font-medium mb-3">
                                                    {event.type}
                                                </span>

                                                {/* Title */}
                                                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                                                    {event.title}
                                                </h3>

                                                {/* Details */}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="w-4 h-4 text-primary" />
                                                        <span>{event.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                </div>

                                                {/* View Details */}
                                                <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                                                    <span>View Details</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Past Events */}
                        {pastEvents.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-gradient-to-b from-muted to-muted-foreground rounded-full"></span>
                                    Past Events
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastEvents.map((event, index) => {
                                        const IconComponent = getEventIcon(event.type);
                                        return (
                                            <div
                                                key={event.id}
                                                className="bg-card border border-border rounded-xl p-6 opacity-75 hover:opacity-100 hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in slide-in-from-bottom duration-500"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                                onClick={() => setSelectedEvent(event)}
                                            >
                                                {/* Event Icon */}
                                                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <IconComponent className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                
                                                {/* Type Badge */}
                                                <span className="inline-block px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium mb-3">
                                                    {event.type}
                                                </span>

                                                {/* Title */}
                                                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                                                    {event.title}
                                                </h3>

                                                {/* Details */}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{event.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                </div>

                                                {/* View Details */}
                                                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary font-medium text-sm group-hover:gap-2 transition-all">
                                                    <span>View Details</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default EventsPage;