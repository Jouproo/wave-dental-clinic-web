"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Clock, Award, Users, Shield, Headphones } from "lucide-react";

const reasons = [
  {
    icon: Award,
    title: "Expert Team",
    description: "Board-certified dentists with advanced training and 15+ years of combined experience.",
  },
  {
    icon: Shield,
    title: "Safe & Sterile",
    description: "Hospital-grade sterilization protocols and the latest infection control standards.",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Evening and weekend appointments available to fit your busy schedule.",
  },
  {
    icon: Users,
    title: "Family-Friendly",
    description: "We welcome patients of all ages, from toddlers to seniors.",
  },
  {
    icon: CheckCircle,
    title: "Pain-Free Experience",
    description: "Advanced sedation options and gentle techniques for anxiety-free treatment.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always available for dental emergencies and post-treatment questions.",
  },
];

export default function WhyChooseUs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why-us" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              The Wave Dental
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Difference
              </span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              We combine cutting-edge technology with compassionate care to deliver
              exceptional dental experiences. Every patient deserves a healthy,
              beautiful smile — and we&apos;re here to make that happen.
            </p>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">5,000+</div>
                <div className="text-gray-600 text-sm">Smiles Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">4.9</div>
                <div className="text-gray-600 text-sm">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">15+</div>
                <div className="text-gray-600 text-sm">Years Experience</div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {reasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <reason.icon size={22} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{reason.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
