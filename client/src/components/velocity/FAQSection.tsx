import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How does the AI make each email personal?',
    answer:
      'It reads a few emails you write to learn how you sound. Then it makes a unique version for each person based on who they are and what they do. Every email sounds like you wrote it yourself.',
  },
  {
    question: 'Do emails come from my Gmail?',
    answer:
      'Yes. We connect to your Gmail using Google sign-in (the same way you log into other apps). All emails send from your real email address.',
  },
  {
    question: 'What if someone replies?',
    answer:
      'We watch for replies and stop any follow-up emails automatically. You get a text message when someone responds. If they want to meet, we can add it to your calendar.',
  },
  {
    question: 'Can I cancel whenever?',
    answer:
      'Yes. No commitment. Change plans or cancel from your account anytime. The free plan works forever and never asks for a card.',
  },
  {
    question: 'How do you know when people reply?',
    answer:
      'We check your inbox and watch the conversation. We catch replies even if someone emails from a different address or forwards your message to someone else.',
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-sky-50 text-sky-700 border border-sky-100">
            <HelpCircle className="w-4 h-4" />
            <span>Questions</span>
          </div>
          <h2 className="text-display text-slate-900 mb-4">
            Common <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">questions</span>
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
            Just email us. We will help you out.
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