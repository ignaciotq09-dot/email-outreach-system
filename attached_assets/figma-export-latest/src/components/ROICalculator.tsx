import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { TrendingUp, Users, Mail, DollarSign } from 'lucide-react';
import { Calculator } from 'lucide-react';

export function ROICalculator() {
  const [emailsPerMonth, setEmailsPerMonth] = useState(1000);
  const [responseRate, setResponseRate] = useState(5);
  const [dealValue, setDealValue] = useState(5000);
  
  // Calculations
  const responses = Math.round(emailsPerMonth * (responseRate / 100));
  const meetingsBooked = Math.round(responses * 0.3); // 30% of responses become meetings
  const deals = Math.round(meetingsBooked * 0.25); // 25% close rate
  const monthlyRevenue = deals * dealValue;
  const annualRevenue = monthlyRevenue * 12;
  const velocityCost = emailsPerMonth > 2000 ? 149 : 49; // Pro or Scale plan
  const roi = Math.round(((monthlyRevenue - velocityCost) / velocityCost) * 100);

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(15, 23, 42, 0.1) 0%, transparent 50%)'
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-sky-50 text-sky-700 border border-sky-100 mb-4">
            <Calculator className="w-4 h-4 inline mr-2" />
            ROI Calculator
          </div>
          <h2 className="text-display mb-4" style={{ color: 'var(--deep-navy)' }}>
            Calculate Your Potential ROI
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--slate-600)' }}>
            See how much revenue you could generate with VELOCITY
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Calculator Controls */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-brand-strong border-2" style={{ borderColor: 'var(--slate-200)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--deep-navy)' }}>Your Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Emails per month */}
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="flex items-center gap-2" style={{ color: 'var(--slate-600)' }}>
                      <Mail className="w-5 h-5" style={{ color: 'var(--electric-teal)' }} />
                      Emails per month
                    </label>
                    <span className="px-3 py-1 rounded-full" style={{ 
                      background: 'var(--slate-50)',
                      color: 'var(--deep-navy)'
                    }}>
                      {emailsPerMonth.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[emailsPerMonth]}
                    onValueChange={(value) => setEmailsPerMonth(value[0])}
                    min={100}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Response rate */}
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="flex items-center gap-2" style={{ color: 'var(--slate-600)' }}>
                      <TrendingUp className="w-5 h-5" style={{ color: 'var(--electric-teal)' }} />
                      Expected response rate
                    </label>
                    <span className="px-3 py-1 rounded-full" style={{ 
                      background: 'var(--slate-50)',
                      color: 'var(--deep-navy)'
                    }}>
                      {responseRate}%
                    </span>
                  </div>
                  <Slider
                    value={[responseRate]}
                    onValueChange={(value) => setResponseRate(value[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Average deal value */}
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="flex items-center gap-2" style={{ color: 'var(--slate-600)' }}>
                      <DollarSign className="w-5 h-5" style={{ color: 'var(--electric-teal)' }} />
                      Average deal value
                    </label>
                    <span className="px-3 py-1 rounded-full" style={{ 
                      background: 'var(--slate-50)',
                      color: 'var(--deep-navy)'
                    }}>
                      ${dealValue.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[dealValue]}
                    onValueChange={(value) => setDealValue(value[0])}
                    min={1000}
                    max={50000}
                    step={1000}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Main ROI Card */}
            <Card 
              className="shadow-brand-strong border-0 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, var(--electric-teal), var(--deep-navy))'
                }}
              ></div>
              <CardContent className="pt-8 pb-8 relative z-10">
                <div className="text-center text-white">
                  <p className="mb-2 text-white/80">Estimated Monthly ROI</p>
                  <motion.div
                    key={roi}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <div className="flex items-baseline justify-center gap-2 mb-4">
                      <TrendingUp className="w-8 h-8" />
                      <span className="text-display-lg">{roi > 0 ? roi : 0}%</span>
                    </div>
                  </motion.div>
                  <p className="text-sm text-white/80">
                    Return on investment
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-brand-medium">
                <CardContent className="pt-6 pb-6 text-center">
                  <motion.div
                    key={responses}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="text-3xl mb-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                      {responses}
                    </div>
                  </motion.div>
                  <div className="text-sm" style={{ color: 'var(--slate-600)' }}>
                    Responses
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-brand-medium">
                <CardContent className="pt-6 pb-6 text-center">
                  <motion.div
                    key={meetingsBooked}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="text-3xl mb-1 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {meetingsBooked}
                    </div>
                  </motion.div>
                  <div className="text-sm" style={{ color: 'var(--slate-600)' }}>
                    Meetings
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-brand-medium">
                <CardContent className="pt-6 pb-6 text-center">
                  <motion.div
                    key={deals}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="text-3xl mb-1 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {deals}
                    </div>
                  </motion.div>
                  <div className="text-sm" style={{ color: 'var(--slate-600)' }}>
                    Closed Deals
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-brand-medium">
                <CardContent className="pt-6 pb-6 text-center">
                  <motion.div
                    key={monthlyRevenue}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="text-3xl mb-1" style={{ color: 'var(--success-green)' }}>
                      ${(monthlyRevenue / 1000).toFixed(0)}K
                    </div>
                  </motion.div>
                  <div className="text-sm" style={{ color: 'var(--slate-600)' }}>
                    Monthly Revenue
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Annual projection */}
            <Card 
              className="shadow-brand-medium border-2"
              style={{ borderColor: 'var(--success-green)' }}
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--slate-600)' }}>
                      Annual Revenue Projection
                    </p>
                    <motion.div
                      key={annualRevenue}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <p className="text-4xl" style={{ color: 'var(--success-green)' }}>
                        ${(annualRevenue / 1000).toFixed(0)}K
                      </p>
                    </motion.div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: 'var(--slate-600)' }}>
                      VELOCITY Cost
                    </p>
                    <p className="text-2xl" style={{ color: 'var(--deep-navy)' }}>
                      ${velocityCost}/mo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}