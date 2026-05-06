"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CalendarCheck, Stethoscope, ClipboardList, Smile } from "lucide-react";

const steps = [
  {
    icon: CalendarCheck,
    step: "01",
    title: "Book Appointment",
    description: "Schedule your visit online or via WhatsApp at your convenience.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Stethoscope,
    step: "02",
    title: "Consultation",
    description: "Meet with our expert dentist for a thorough examination and diagnosis.",
    color: "from-teal-500 to-teal-600",
  },
  {
    icon: ClipboardList,
    step: "03",
    title: "Treatment Plan",
    description: "Receive a personalized, transparent treatment plan with clear pricing.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Smile,
    step: "04",
    title: "Enjoy Your Smile",
    description: "Experience world-class treatment and leave with your perfect smile.",
    color: "from-indigo-500 to-indigo-600",
  },
];

export default function PatientJourney() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="journey" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Your Patient Journey
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Getting the smile you&apos;ve always wanted is easier than you think.
            Here&apos;s what to expect at Wave Dental Clinic.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative"
            >
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}
              >
                <step.icon size={28} className="text-white" />
              </div>
              <span className="text-5xl font-black text-gray-100 absolute -top-2 left-1/2 -translate-x-1/2 -z-10 select-none">
                {step.step}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
