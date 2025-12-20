import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How does the AI personalization work?',
    answer:
      'Our AI analyzes your writing style from sample emails and learns your tone, vocabulary, and messaging patterns. It then generates unique emails for each recipient based on their profile, company, and context—ensuring every message feels personally written.',
  },
  {
    question: 'Will emails be sent from my Gmail account?',
    answer:
      'Yes! The system connects directly to your Gmail account via secure OAuth. All emails are sent from your actual email address, maintaining your domain reputation and ensuring deliverability.',
  },
  {
    question: 'What happens if someone replies?',
    answer:
      'Our 4-layer reply detection system monitors responses across all threads and automatically stops any scheduled follow-ups. You receive instant notifications via email and SMS, and the AI can even book meetings directly to your calendar if requested.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. There are no contracts or commitments. You can upgrade, downgrade, or cancel your subscription at any time from your account settings. The free plan is available forever with no credit card required.',
  },
  {
    question: 'How accurate is the reply detection?',
    answer:
      'Our reply detection has a 99.7% accuracy rate. It monitors primary inbox, threaded replies, different email aliases, and even catches responses that come from forwarded emails or different domains within the same organization.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-sky-50 text-sky-700 border border-sky-100 mb-4">
            💡 FAQ
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Questions? <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Answered.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 border-slate-200 rounded-xl px-6 bg-white hover:border-sky-300 hover:shadow-md transition-all"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="text-slate-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center p-8 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border-2 border-sky-200"
        >
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-slate-900 mb-2">
            Still have questions?
          </p>
          <p className="text-slate-600 mb-6 text-sm">
            Can't find the answer you're looking for? Please chat to our friendly team.
          </p>
          <a
            href="mailto:support@velocity.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-sky-500/30"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}