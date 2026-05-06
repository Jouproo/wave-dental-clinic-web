"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Smile, Shield, Zap, AlignCenter, Heart, Microscope } from "lucide-react";

const services = [
  {
    icon: Smile,
    title: "Cosmetic Dentistry",
    description:
      "Transform your smile with veneers, bonding, and smile makeovers tailored to your unique features.",
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: AlignCenter,
    title: "Orthodontics",
    description:
      "Achieve perfectly aligned teeth with Invisalign or traditional braces for all ages.",
    iconColor: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    icon: Zap,
    title: "Teeth Whitening",
    description:
      "Professional whitening treatments that deliver dramatic, long-lasting results safely.",
    iconColor: "text-cyan-500",
    bg: "bg-cyan-50",
  },
  {
    icon: Shield,
    title: "Dental Implants",
    description:
      "Permanent, natural-looking tooth replacements that restore full function and aesthetics.",
    iconColor: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Heart,
    title: "Preventive Care",
    description:
      "Regular cleanings, check-ups, and preventive treatments to maintain optimal oral health.",
    iconColor: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Microscope,
    title: "Advanced Technology",
    description:
      "State-of-the-art digital X-rays, 3D scanning, and laser treatments for precise care.",
    iconColor: "text-violet-500",
    bg: "bg-violet-50",
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Comprehensive Dental Care
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            From routine check-ups to advanced cosmetic procedures, we offer a
            complete range of dental services under one roof.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${service.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <service.icon size={28} className={service.iconColor} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
