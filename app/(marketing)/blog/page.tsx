'use client'

import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, User, ChevronRight, Search, Cpu, Settings, Users as UsersIcon, Rocket, Smartphone, Zap, Loader2, BookOpen } from "lucide-react";

interface BlogPostType {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    date: string;
    link: string;
    thumbnail?: string;
    categories?: string[];
}

const BlogPage = () => {
    const [posts, setPosts] = useState<BlogPostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        fetchMediumPosts();
    }, []);

    const fetchMediumPosts = async () => {
        try {
            setLoading(true);
            // Medium RSS to JSON endpoint
            const mediumUsername = process.env.NEXT_PUBLIC_MEDIUM_USERNAME || '@assura';
            const response = await fetch(
                `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${mediumUsername}`
            );
            const data = await response.json();

            if (data.status === 'ok') {
                const formattedPosts: BlogPostType[] = data.items.map((item: any) => ({
                    id: item.guid,
                    title: item.title,
                    excerpt: item.description.replace(/<[^>]+>/g, '').substring(0, 200) + '...',
                    content: item.content || item.description,
                    author: item.author,
                    date: new Date(item.pubDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    link: item.link,
                    thumbnail: item.thumbnail,
                    categories: item.categories || []
                }));
                setPosts(formattedPosts);
            }
        } catch (error) {
            console.error('Error fetching Medium posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const allCategories = ["All", ...Array.from(new Set(posts.flatMap(post => post.categories || [])))];

    const filteredPosts = posts.filter(post => {
        const matchesCategory = selectedCategory === "All" || post.categories?.includes(selectedCategory);
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getReadTime = (content: string) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    };

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
                            Blog
                        </h1>
                        <p className="text-muted-foreground mt-2 animate-in slide-in-from-left duration-500 delay-100">
                            Insights, best practices, and industry trends from our Medium publication
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
                        <p className="text-muted-foreground">Loading blog posts...</p>
                    </div>
                ) : posts.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                            <BookOpen className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">No Blog Posts Yet</h2>
                        <p className="text-muted-foreground text-center max-w-md mb-4">
                            We're working on creating valuable content for you. Check back soon for insights on testing, quality assurance, and software development!
                        </p>
                        <a 
                            href={`https://medium.com/${process.env.NEXT_PUBLIC_MEDIUM_USERNAME || '@testsurely'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 btn-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                        >
                            Visit Our Medium
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Search and Filter Section */}
                        <div className="mb-8 space-y-4">
                            {/* Search Bar */}
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Category Filter */}
                            {allCategories.length > 1 && (
                                <div className="flex flex-wrap gap-3">
                                    {allCategories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                selectedCategory === category
                                                    ? "bg-primary text-white shadow-lg"
                                                    : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Blog Posts Grid */}
                        {filteredPosts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPosts.map((post, index) => (
                                    <article
                                        key={post.id}
                                        className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in slide-in-from-bottom duration-500"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                        onClick={() => window.open(post.link, '_blank')}
                                    >
                                        {/* Image/Thumbnail */}
                                        {post.thumbnail ? (
                                            <div className="w-full h-48 overflow-hidden">
                                                <img 
                                                    src={post.thumbnail} 
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <BookOpen className="w-10 h-10 text-primary" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="p-6">
                                            {/* Category Badge */}
                                            {post.categories && post.categories.length > 0 && (
                                                <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full text-xs font-medium mb-3">
                                                    {post.categories[0]}
                                                </span>
                                            )}

                                            {/* Title */}
                                            <h2 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>

                                            {/* Excerpt */}
                                            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                                                {post.excerpt}
                                            </p>

                                            {/* Meta Info */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{post.author}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{post.date}</span>
                                                </div>
                                            </div>

                                            {/* Read More */}
                                            <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                                                <span>Read on Medium</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            // No Results
                            <div className="text-center py-16">
                                <p className="text-muted-foreground text-lg">
                                    No articles found. Try adjusting your search or filters.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default BlogPage;