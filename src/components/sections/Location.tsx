"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { clinicConfig } from "@/config/clinic";

export default function Location() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="location" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Find Us
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Visit Our Clinic
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We are conveniently located and easy to find. Come visit us or get in
            touch through any of the channels below.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex gap-4 p-5 bg-blue-50 rounded-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-600">{clinicConfig.address}</p>
                <a
                  href={clinicConfig.googleMapsDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium mt-1 hover:underline"
                >
                  Get Directions <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-teal-50 rounded-2xl">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={24} className="text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                <a
                  href={`tel:${clinicConfig.phoneNumber}`}
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  {clinicConfig.phoneNumber}
                </a>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-cyan-50 rounded-2xl">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0">
                <Mail size={24} className="text-cyan-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                <a
                  href={`mailto:${clinicConfig.email}`}
                  className="text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  {clinicConfig.email}
                </a>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-indigo-50 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Working Hours</h3>
                <p className="text-gray-600 text-sm">{clinicConfig.workingHours.weekdays}</p>
                <p className="text-gray-600 text-sm">{clinicConfig.workingHours.saturday}</p>
                <p className="text-gray-600 text-sm">{clinicConfig.workingHours.sunday}</p>
              </div>
            </div>
          </motion.div>

          {/* Google Maps */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-lg h-[400px] bg-gray-100"
          >
            <iframe
              src={clinicConfig.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Wave Dental Clinic Location"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
