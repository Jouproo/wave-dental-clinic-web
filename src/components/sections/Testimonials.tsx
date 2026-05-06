"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    rating: 5,
    text: "Wave Dental Clinic completely transformed my smile! The team is incredibly professional and caring. My veneers look absolutely natural. Best decision I ever made!",
    treatment: "Smile Makeover",
    initials: "SM",
  },
  {
    name: "Ahmed K.",
    rating: 5,
    text: "I was terrified of dentists until I visited Wave Dental. The pain-free approach and friendly staff made my implant procedure stress-free. Highly recommended!",
    treatment: "Dental Implants",
    initials: "AK",
  },
  {
    name: "Emily R.",
    rating: 5,
    text: "My Invisalign journey was smooth and the results are amazing. The doctors kept me informed at every step. My teeth are perfectly straight now!",
    treatment: "Invisalign",
    initials: "ER",
  },
  {
    name: "Michael T.",
    rating: 5,
    text: "The teeth whitening treatment gave me incredible results in just one session. The whole experience was comfortable and the staff were so welcoming.",
    treatment: "Whitening",
    initials: "MT",
  },
  {
    name: "Layla H.",
    rating: 5,
    text: "I bring my whole family to Wave Dental. They are amazing with kids! Professional, gentle, and always make dental visits a pleasant experience.",
    treatment: "Family Dental Care",
    initials: "LH",
  },
  {
    name: "James W.",
    rating: 5,
    text: "Outstanding clinic with state-of-the-art equipment. My full mouth restoration exceeded my expectations. The team truly cares about their patients.",
    treatment: "Full Restoration",
    initials: "JW",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="testimonials"
      className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-300 font-semibold text-sm uppercase tracking-wider mb-3">
            Patient Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            What Our Patients Say
          </h2>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Real stories from real patients who trusted Wave Dental Clinic with
            their smiles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
            >
              <Quote size={30} className="text-teal-300 mb-4 opacity-60" />
              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-blue-100 leading-relaxed mb-5 text-sm">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{t.initials}</span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-teal-300 text-xs">{t.treatment}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
