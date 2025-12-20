import { motion } from 'motion/react';

const companies = [
  { name: 'Salesforce', width: '160' },
  { name: 'HubSpot', width: '140' },
  { name: 'Stripe', width: '120' },
  { name: 'Atlassian', width: '150' },
  { name: 'Zoom', width: '110' },
  { name: 'Slack', width: '120' },
];

export function LogoCloud() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-xs uppercase tracking-widest text-slate-400 mb-8"
        >
          Trusted by teams at
        </motion.p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.5, y: 0 }}
              whileHover={{ opacity: 1, scale: 1.1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center justify-center"
            >
              <div
                className="text-slate-700 font-semibold transition-all cursor-pointer"
                style={{ width: company.width + 'px' }}
              >
                {company.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}