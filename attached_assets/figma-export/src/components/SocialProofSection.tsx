import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';

const testimonials = [
  {
    quote: 'Booked 47 meetings in our first week. The AI personalization is scary good.',
    author: 'Sarah Chen',
    title: 'Head of Sales at TechCorp',
    image: 'https://images.unsplash.com/photo-1543132220-7bc04a0e790a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mjc0MjY1NHww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    quote: "Reply detection actually works. We haven't missed a single response in 3 months.",
    author: 'Marcus Johnson',
    title: 'Founder at GrowthLabs',
    image: 'https://images.unsplash.com/photo-1630344745908-ed5ffd73199a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWNjZXNzZnVsJTIwZW50cmVwcmVuZXVyfGVufDF8fHx8MTc2MjY0MTg3MHww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
];

const stats = [
  { value: 3200000, label: 'Emails Sent', suffix: 'M', gradient: 'from-violet-500 to-purple-600' },
  { value: 847000, label: 'Replies Detected', suffix: 'K', gradient: 'from-fuchsia-500 to-pink-600' },
  { value: 92000, label: 'Meetings Booked', suffix: 'K', gradient: 'from-blue-500 to-cyan-600' },
  { value: 4.8, label: 'Average Rating', suffix: '/5', decimals: 1, gradient: 'from-emerald-500 to-teal-600' },
];

function AnimatedCounter({ value, suffix, decimals = 0, gradient }: { value: number; suffix: string; decimals?: number; gradient: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const displayValue = () => {
    if (suffix === 'M') {
      return (count / 1000000).toFixed(1);
    } else if (suffix === 'K') {
      return (count / 1000).toFixed(0);
    } else {
      return count.toFixed(decimals);
    }
  };

  return (
    <div ref={ref} className={`text-5xl md:text-6xl bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
      {displayValue()}
      {suffix}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.05)_0%,transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 mb-4">
            Social Proof
          </div>
          <h2 className="text-4xl md:text-5xl text-center text-gray-900 mb-4">
            Join 2,847+ Teams Getting Results
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white h-full overflow-hidden relative hover:-translate-y-1">
                {/* Gradient Border on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${testimonial.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}></div>
                <div className="absolute inset-[2px] bg-white rounded-lg z-0"></div>

                <CardContent className="pt-8 pb-8 px-8 relative z-10">
                  {/* Quote Icon */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Quote className="w-6 h-6 text-white" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${testimonial.gradient} rounded-full blur opacity-50`}></div>
                      <ImageWithFallback
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="relative w-14 h-14 rounded-full object-cover ring-2 ring-white"
                      />
                    </div>
                    <div>
                      <div className="text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-600">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-violet-50/50 via-white to-fuchsia-50/50 border border-violet-100 shadow-xl"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals}
                gradient={stat.gradient}
              />
              <div className="text-gray-600 mt-3">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
