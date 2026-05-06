"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { clinicConfig } from "@/config/clinic";

const cases = [
  { title: "Smile Makeover", treatment: "Veneers + Whitening" },
  { title: "Orthodontic Treatment", treatment: "Invisalign 12 months" },
  { title: "Dental Implants", treatment: "Full arch restoration" },
];

export default function BeforeAfter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="results" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Real Results
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Before &amp; After
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            See the life-changing transformations our patients have experienced at
            Wave Dental Clinic.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="grid grid-cols-2">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-1">😐</div>
                    <span className="text-xs text-gray-500 font-medium">Before</span>
                  </div>
                </div>
                <div className="h-48 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-1">😁</div>
                    <span className="text-xs text-teal-600 font-medium">After</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900">{c.title}</h3>
                <p className="text-teal-600 text-sm">{c.treatment}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-gray-500 text-sm mb-4">
            * Real patient photos coming soon.
          </p>
          <a
            href={`https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(clinicConfig.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
          >
            See More Results <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
