import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ArrowLeftRight, Mail, Sparkles } from 'lucide-react';

export function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(25);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-[120px]"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-[120px]"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-white/10 backdrop-blur-sm border border-white/20"
            style={{ 
              color: 'var(--electric-teal)'
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Transformation</span>
          </div>
          <h2 className="text-display mb-4 text-white">
            Before & After AI Personalization
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-slate-400">
            Drag the slider to see the transformation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="relative rounded-2xl overflow-hidden select-none cursor-col-resize border-2"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onTouchMove={handleTouchMove}
            style={{ 
              height: '600px',
              borderColor: 'rgba(6, 182, 212, 0.3)',
              boxShadow: '0 0 60px rgba(6, 182, 212, 0.2)'
            }}
          >
            {/* BEFORE (Generic Email) - Full background */}
            <div className="absolute inset-0 p-8 flex flex-col" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
              <div className="flex items-center gap-2 mb-6">
                <div 
                  className="px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: 'rgba(239, 68, 68, 1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  BEFORE
                </div>
                <span className="text-sm text-slate-400">Generic Template</span>
              </div>
              
              <Card 
                className="flex-1 p-6 shadow-lg border"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderColor: 'rgba(100, 116, 139, 0.3)'
                }}
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: 'rgba(100, 116, 139, 0.3)' }}>
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-white">
                      Product Demo Request
                    </div>
                    <div className="text-xs text-slate-500">
                      to: prospect@company.com
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm text-slate-300">
                  <p>Hi there,</p>
                  <p className="opacity-75">
                    I wanted to reach out and see if you'd be interested in learning more about our product. We help companies like yours improve their sales process.
                  </p>
                  <p className="opacity-75">
                    Would you be available for a quick 15-minute call this week to discuss?
                  </p>
                  <p className="opacity-75">Let me know if you're interested.</p>
                  <p>Best regards,<br />Sales Team</p>
                </div>
              </Card>

              <div className="mt-4 text-sm text-slate-400 space-y-1">
                <div>❌ Generic greeting</div>
                <div>❌ No personalization</div>
                <div>❌ Vague value proposition</div>
                <div>❌ Low response rate</div>
              </div>
            </div>

            {/* AFTER (AI Personalized) - Revealed by slider */}
            <div 
              className="absolute inset-0 p-8 flex flex-col"
              style={{ 
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                background: 'rgba(15, 23, 42, 0.5)'
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div 
                  className="px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: 'rgba(16, 185, 129, 1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  AFTER
                </div>
                <span className="text-sm text-cyan-400">AI-Powered VELOCITY</span>
              </div>
              
              <Card 
                className="flex-1 p-6 shadow-lg border-2"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)'
                }}
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-sm text-white">
                      Congrats on the Series B - Quick Question
                    </div>
                    <div className="text-xs text-slate-400">
                      to: sarah.chen@techcorp.com
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm text-slate-200">
                  <p>Hi Sarah,</p>
                  <p>
                    Congrats on TechCorp's recent $12M Series B! I saw the announcement on TechCrunch and noticed you're planning to expand your sales team by 40%.
                  </p>
                  <p>
                    Given your focus on enterprise SaaS sales, I thought you might be interested in how we helped GrowthLabs increase their meeting bookings by 3x after their Series A.
                  </p>
                  <p>
                    I have a 2-minute video showing exactly how they did it. Would it be helpful if I sent it over?
                  </p>
                  <p>
                    P.S. - Loved your recent post on LinkedIn about AI in sales. The point about maintaining human connection really resonated.
                  </p>
                  <p>Best,<br />Marcus Johnson</p>
                </div>
              </Card>

              <div className="mt-4 text-sm text-cyan-400 space-y-1">
                <div>✅ Personalized to recipient</div>
                <div>✅ Relevant context & timing</div>
                <div>✅ Specific value proposition</div>
                <div>✅ 5x higher response rate</div>
              </div>
            </div>

            {/* Slider handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 pointer-events-none z-20"
              style={{ 
                left: `${sliderPosition}%`,
                backgroundColor: 'rgba(6, 182, 212, 1)',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.4)'
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 blur-sm"
                style={{ 
                  backgroundColor: 'rgba(6, 182, 212, 0.5)',
                  width: '3px',
                  left: '-1px'
                }}
              />
              
              {/* Handle */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto cursor-col-resize shadow-xl border-4 border-white"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(139, 92, 246, 1))',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.6), 0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </div>

              {/* Top arrow indicator */}
              <div 
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full text-white whitespace-nowrap"
                style={{ 
                  background: 'rgba(6, 182, 212, 0.9)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
                }}
              >
                {Math.round(sliderPosition)}%
              </div>
            </div>
          </div>

          {/* Instructions */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 text-sm text-slate-400"
          >
            👆 Drag the slider to reveal AI transformation
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}