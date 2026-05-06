"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How do I book an appointment?",
    a: "You can easily book an appointment through our online booking system, by calling our clinic directly, or by sending us a WhatsApp message. We strive to offer same-day or next-day appointments when possible.",
  },
  {
    q: "Do you accept dental insurance?",
    a: "Yes, we work with most major dental insurance providers. Please contact us before your visit to verify your coverage, or bring your insurance card to your appointment.",
  },
  {
    q: "Is the treatment painful?",
    a: "Patient comfort is our top priority. We use the latest pain-free techniques and local anesthesia to ensure your comfort during all procedures. We also offer sedation options for anxious patients.",
  },
  {
    q: "How long does teeth whitening last?",
    a: "Professional teeth whitening results typically last 1-3 years depending on your diet, lifestyle, and oral hygiene habits. We recommend touch-up treatments and provide take-home kits to maintain your results.",
  },
  {
    q: "How long does Invisalign take?",
    a: "The duration varies depending on your specific case, but most Invisalign treatments take between 6-18 months. During your consultation, our orthodontist will provide a personalized timeline for your treatment.",
  },
  {
    q: "Do you offer payment plans?",
    a: "Yes! We believe everyone deserves a beautiful smile. We offer flexible payment plans and financing options to make dental care accessible. Ask our team for details during your consultation.",
  },
  {
    q: "What should I expect at my first visit?",
    a: "Your first visit includes a comprehensive examination, dental X-rays, professional cleaning, and a detailed discussion of your dental health and any treatment options. We typically allocate 60-90 minutes for new patients.",
  },
];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 text-lg">
            Everything you need to know about dental care at Wave Dental Clinic.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="border border-gray-100 rounded-2xl overflow-hidden"
            >
              <button
                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-semibold text-gray-900">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
