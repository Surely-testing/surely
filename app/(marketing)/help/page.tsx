'use client'

import React, { useState } from 'react';
import { Search, BookOpen, Zap, Settings, CreditCard, Users, ChevronDown, ChevronRight, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { helpArticles } from '@/utils/help-article-date';

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Getting Started",
      description: "Learn the basics of Surely",
      slug: "getting-started",
      articles: helpArticles.gettingStarted
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Features & Tools",
      description: "Explore Surely's capabilities",
      slug: "features",
      articles: helpArticles.featuresTools
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Account Management",
      description: "Manage your account settings",
      slug: "account",
      articles: helpArticles.accountManagement
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Billing & Plans",
      description: "Subscription and payment help",
      slug: "billing",
      articles: helpArticles.billingPlans
    }
  ];

  const faqs = [
    {
      question: "How do I create my first test suite?",
      answer: "To create your first test suite, navigate to the Dashboard and click the 'New Test Suite' button. Give it a name, select your testing environment, and start adding test cases. You can also use our AI-powered test generation feature to automatically create tests based on your application."
    },
    {
      question: "Can I integrate Surely with my existing CI/CD pipeline?",
      answer: "Yes! Surely seamlessly integrates with popular CI/CD tools like GitHub Actions, GitLab CI, Jenkins, and CircleCI. Simply go to Settings > Integrations, select your platform, and follow the setup instructions. We provide webhooks for custom integrations."
    },
    {
      question: "What's included in the free trial?",
      answer: "The 14-day free trial gives you full access to all Professional plan features, including unlimited test suites, advanced AI features, priority support, and all integrations. No credit card is required to start your trial."
    },
    {
      question: "How do I invite team members?",
      answer: "Go to Settings > Team, click 'Invite Member', and enter their email address. You can set their role (Admin, Developer, or Viewer) to control their permissions. Invited members will receive an email with instructions to join your workspace."
    },
    {
      question: "Can I export my test results?",
      answer: "Absolutely! You can export test results in multiple formats including PDF, CSV, and JSON. Navigate to any test run, click the 'Export' button, and choose your preferred format. You can also set up automated reports to be sent to your team via email."
    },
    {
      question: "What happens if I exceed my plan's limits?",
      answer: "We'll notify you when you're approaching your plan limits. You can either upgrade to a higher plan for more capacity, or archive older test suites to free up space. Your tests won't be interrupted, and you'll have time to make adjustments."
    },
    {
      question: "How secure is my data?",
      answer: "Security is our top priority. All data is encrypted in transit and at rest using industry-standard encryption. We're SOC 2 Type II certified and comply with GDPR. We also offer SSO, 2FA, and IP whitelisting on Enterprise plans."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from Settings > Billing. Your account will remain active until the end of your current billing period, and you'll retain access to your data. We also offer a 30-day money-back guarantee."
    }
  ];

  const quickLinks = [
    { title: "Video Tutorials", icon: <BookOpen className="h-5 w-5" />, link: "#" },
    { title: "Community Forum", icon: <MessageCircle className="h-5 w-5" />, link: "#" },
    { title: "System Status", icon: <Zap className="h-5 w-5" />, link: "#" }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter categories and articles based on search
  const filteredCategories = searchQuery
    ? categories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.steps?.some(step => step.toLowerCase().includes(searchQuery.toLowerCase())) ||
          article.tips?.some(tip => tip.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })).filter(category => category.articles.length > 0)
    : categories;

  const currentCategory = categories.find(cat => cat.slug === selectedCategory);
  
  const hasSearchResults = searchQuery && (filteredCategories.length > 0 || filteredFaqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section with Search */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground">
              Search our knowledge base or browse categories below
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid or Search Results */}
      {!selectedCategory && (
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {searchQuery && filteredCategories.length === 0 && filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  No results found for "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </div>
            ) : (
              <>
                {searchQuery && filteredCategories.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6">
                      Articles matching "{searchQuery}"
                    </h2>
                  </div>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(category.slug)}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all text-left w-full group"
                    >
                      <div className="text-muted-foreground mb-4 group-hover:text-primary transition-colors">
                        {category.icon}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {category.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>

                      <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        <span>{category.articles.length} articles</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Category Articles View with Collapsible Content */}
      {selectedCategory && currentCategory && (
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to categories
            </button>

            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {currentCategory.title}
              </h2>
              <p className="text-muted-foreground">
                {currentCategory.description}
              </p>
            </div>

            <div className="space-y-3">
              {currentCategory.articles.map((article, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-lg font-semibold text-foreground pr-4">
                      {article.title}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {article.content}
                      </p>

                      {article.steps && article.steps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-foreground mb-3">Steps:</h4>
                          <ol className="space-y-2 ml-5">
                            {article.steps.map((step, idx) => (
                              <li key={idx} className="text-muted-foreground list-decimal">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {article.tips && article.tips.length > 0 && (
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="text-primary">💡</span> Pro Tips:
                          </h4>
                          <ul className="space-y-2">
                            {article.tips.map((tip, idx) => (
                              <li key={idx} className="text-muted-foreground text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-3">
            {(searchQuery ? filteredFaqs : faqs).map((faq, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {searchQuery && filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No results found for "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Additional Resources
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <a
                key={index}
                href={link.link}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all group flex items-center gap-3"
              >
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  {link.icon}
                </div>
                <span className="font-medium text-foreground">
                  {link.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Still need help?
          </h2>
          <p className="text-muted-foreground mb-8">
            Our support team is here to assist you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact">
              <Button size="lg">
                Contact Support
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenterPage;