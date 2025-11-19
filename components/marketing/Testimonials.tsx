// ============================================
// FILE: components/marketing/Testimonials.tsx
// ============================================
import React from 'react'
import { Star, Users } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'QA Director',
      company: 'TechFlow',
      content: 'Surely transformed our testing workflow completely. We\'ve seen a 78% reduction in bug escapes and our team productivity has doubled.',
      avatar: 'SC',
      rating: 5,
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Lead Engineer',
      company: 'StartupXYZ',
      content: 'The AI-powered test generation is incredible. What used to take us weeks now happens in hours with better coverage.',
      avatar: 'MR',
      rating: 5,
    },
    {
      name: 'Emily Johnson',
      role: 'Product Manager',
      company: 'ScaleApp',
      content: 'Finally, a QA tool that speaks our language. The reporting features have revolutionized our stakeholder communications.',
      avatar: 'EJ',
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card rounded-full px-4 py-2 mb-8 shadow-theme-sm border border-border">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Testimonials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Trusted by teams worldwide
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            See how leading companies are transforming their QA processes with Surely
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-theme-lg"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.company}
                  </p>
                </div>
              </div>

              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-warning fill-current"
                  />
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Testimonials }