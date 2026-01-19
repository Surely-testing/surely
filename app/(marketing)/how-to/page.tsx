'use client';

import React, { useState, useEffect } from 'react';
import { Play, Search, Clock, BookOpen, ArrowRight, Loader2 } from 'lucide-react';

interface Guide {
  id: string;
  videoId: string;
  category: string;
  difficulty: string;
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  videoUrl: string;
}

interface Category {
  id: string;
  label: string;
}

interface VideoMetadata {
  videoId: string;
  category: string;
  difficulty: string;
}

export default function HowToPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Guide | null>(null);

  const categories: Category[] = [
    { id: 'all', label: 'All Guides' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'recording', label: 'Screen Recording' },
    { id: 'testing', label: 'Test Management' },
    { id: 'collaboration', label: 'Team Collaboration' }
  ];

  const videoMetadata: VideoMetadata[] = [
    { videoId: 'eXitEea7d7c', category: 'getting-started', difficulty: 'Beginner' },
    { videoId: 'hh215p1YQhg', category: 'getting-started', difficulty: 'Beginner' },
    { videoId: 'JRUQeWA9Sh4', category: 'getting-started', difficulty: 'Beginner' },
    { videoId: 'BUbfCcnBgV4', category: 'getting-started', difficulty: 'Beginner' },
    // { videoId: 'kJQP7kiw5Fk', category: 'recording', difficulty: 'Beginner' },
    // { videoId: 'YE7VzlLtp-4', category: 'recording', difficulty: 'Intermediate' },
    // { videoId: 'fJ9rUzIMcZQ', category: 'recording', difficulty: 'Intermediate' },
    // { videoId: 'Bey4XXJAqS8', category: 'testing', difficulty: 'Intermediate' },
    { videoId: 'pdyhzvvefxQ', category: 'testing', difficulty: 'Intermediate' },
    // { videoId: '3JZ_D3ELwOQ', category: 'testing', difficulty: 'Advanced' },
    // { videoId: 'lTTajzrSkCw', category: 'collaboration', difficulty: 'Beginner' },
    // { videoId: 'PT2_F-1esPk', category: 'collaboration', difficulty: 'Intermediate' }
  ];

  useEffect(() => {
    const fetchAllVideoData = async () => {
      setLoading(true);
      const fetchedGuides: Guide[] = [];

      for (const meta of videoMetadata) {
        try {
          const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${meta.videoId}`);
          const data = await response.json();

          if (data && data.title) {
            fetchedGuides.push({
              id: meta.videoId,
              videoId: meta.videoId,
              category: meta.category,
              difficulty: meta.difficulty,
              title: data.title,
              description: data.author_name ? `By ${data.author_name}` : 'YouTube Video',
              thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${meta.videoId}/maxresdefault.jpg`,
              author: data.author_name || 'Unknown',
              videoUrl: `https://www.youtube.com/watch?v=${meta.videoId}`
            });
          }
        } catch (error) {
          console.error(`Error fetching video ${meta.videoId}:`, error);
        }
      }

      setGuides(fetchedGuides);
      setLoading(false);
    };

    fetchAllVideoData();
  }, []);

  const filteredGuides = guides.filter(guide => {
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'all') return guides.length;
    return guides.filter(g => g.category === categoryId).length;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Advanced': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-cyan-50 dark:from-blue-950/20 dark:via-background dark:to-cyan-950/20" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              How-To Guides
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Step-by-step video tutorials to help you master Surely and level up your QA workflow
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none bg-background text-foreground transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background border border-border hover:border-primary text-foreground'
                }`}
              >
                {category.label}
                <span className={`ml-2 text-sm ${
                  selectedCategory === category.id ? 'text-white/80' : 'text-muted-foreground'
                }`}>
                  ({getCategoryCount(category.id)})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="ml-4 text-lg text-muted-foreground">Loading videos from YouTube...</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => setSelectedVideo(guide)}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-cyan-500 relative overflow-hidden">
                    <img 
                      src={guide.thumbnail} 
                      alt={guide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                        {guide.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {guide.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4">
                      {guide.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{guide.author}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredGuides.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No guides found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </section>

      {/* Video Overlay */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Still Have Questions?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Can't find what you're looking for? Check our help center or contact support.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 rounded-lg bg-white text-blue-600 font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-xl">
                  <BookOpen className="h-5 w-5" />
                  Visit Help Center
                </button>
                <button className="px-8 py-4 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
