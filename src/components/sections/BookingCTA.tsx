"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, MessageCircle, ArrowRight } from "lucide-react";
import { clinicConfig } from "@/config/clinic";

export default function BookingCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const whatsappUrl = `https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(clinicConfig.whatsappMessage)}`;

  return (
    <section id="booking" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Get Started
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready for Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
              Dream Smile?
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10">
            Book your consultation today and take the first step towards the perfect
            smile. Our team is ready to help you achieve your dental goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={clinicConfig.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Calendar size={22} />
              <span>Book Appointment Online</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <MessageCircle size={22} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            Free consultation • No hidden fees • Flexible payment plans
          </p>
        </motion.div>
      </div>
    </section>
  );
}
