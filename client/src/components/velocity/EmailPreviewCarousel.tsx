import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const emailExamples = [
  {
    subject: 'Quick question about TechCorp\'s Q4 initiatives',
    preview:
      'Hi Sarah,\n\nI noticed TechCorp recently announced your expansion into the European market—congrats on the growth! I\'m reaching out because we\'ve helped similar B2B SaaS companies scale their outbound during international expansion.\n\nWould you be open to a 15-minute chat next week about how we reduced CAC by 40% for a company in your space?\n\nBest,\nAlex',
    color: 'violet',
  },
  {
    subject: 'Loved your recent keynote on AI in sales',
    preview:
      'Hey Marcus,\n\nYour keynote at the SaaS Summit on "Why Sales Teams Still Need Humans" really resonated with me—especially the part about empathy in discovery calls. That\'s exactly the balance we\'re trying to strike with our platform.\n\nI\'d love to get your take on how AI could support (not replace) your team at GrowthLabs. Coffee chat?\n\nCheers,\nAlex',
    color: 'fuchsia',
  },
  {
    subject: 'Following up on our intro from Jennifer',
    preview:
      'Hi David,\n\nJennifer mentioned you\'re looking to streamline your outbound process before the new quarter. I completely understand—hiring SDRs is expensive and training takes forever.\n\nWe\'ve built something that might help. Would Thursday at 2pm work for a quick demo?\n\nThanks,\nAlex',
    color: 'blue',
  },
];

export function EmailPreviewCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % emailExamples.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + emailExamples.length) % emailExamples.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-violet-200 rounded-full filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-fuchsia-200 rounded-full filter blur-3xl opacity-20"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-sky-50 text-sky-700 border border-sky-100">
            <Mail className="w-4 h-4" />
            <span>AI-Powered Personalization</span>
          </div>
          <h2 className="text-display text-center text-gray-900 mb-4">
            See AI Personalization In Action
          </h2>
          <p className="text-center text-gray-600 text-lg">
            Every email is uniquely written—no templates, no copy-paste
          </p>
        </motion.div>

        <div className="relative">
          <div className="relative h-[400px] md:h-[380px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm h-full overflow-hidden group">
                  {/* Card Gradient Border */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-${emailExamples[currentIndex].color}-500 to-${emailExamples[currentIndex].color}-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}></div>
                  <div className="absolute inset-[2px] bg-white rounded-lg z-0"></div>

                  <CardContent className="p-8 relative z-10 h-full flex flex-col">
                    {/* Email Header */}
                    <div className="mb-6 pb-6 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r from-${emailExamples[currentIndex].color}-500 to-${emailExamples[currentIndex].color}-600`}></div>
                        <span className="text-xs uppercase tracking-wide text-gray-500">Subject</span>
                      </div>
                      <div className="text-lg text-gray-900">
                        {emailExamples[currentIndex].subject}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {emailExamples[currentIndex].preview}
                      </div>
                    </div>

                    {/* AI Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-50 to-fuchsia-50 text-xs text-violet-700">
                        <Sparkles className="w-3 h-3" />
                        <span>100% AI-Generated Personalization</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="w-12 h-12 rounded-full border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-violet-600" />
            </Button>

            <div className="flex gap-2">
              {emailExamples.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className="relative group"
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 scale-110'
                        : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-50"></div>
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="w-12 h-12 rounded-full border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all shadow-lg"
            >
              <ChevronRight className="w-5 h-5 text-violet-600" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}