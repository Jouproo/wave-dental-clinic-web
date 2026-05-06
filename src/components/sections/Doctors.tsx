"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Award, GraduationCap } from "lucide-react";

const doctors = [
  {
    name: "Dr. [Name]",
    specialty: "Cosmetic & Restorative Dentistry",
    experience: "12+ years",
    education: "Doctor of Dental Medicine",
  },
  {
    name: "Dr. [Name]",
    specialty: "Orthodontics & Invisalign",
    experience: "10+ years",
    education: "Orthodontics Specialist",
  },
  {
    name: "Dr. [Name]",
    specialty: "Oral Surgery & Implants",
    experience: "15+ years",
    education: "Oral & Maxillofacial Surgery",
  },
];

export default function Doctors() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="doctors" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Our Team
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Meet Our Doctors
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our team of experienced specialists is dedicated to providing you with
            the highest quality dental care.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {doctors.map((doctor, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 text-center"
            >
              {/* Photo placeholder */}
              <div className="h-56 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-teal-200 flex items-center justify-center">
                  <span className="text-4xl">👨‍⚕️</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.name}</h3>
                <p className="text-teal-600 font-medium text-sm mb-4">{doctor.specialty}</p>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Award size={16} className="text-blue-500" />
                    <span>{doctor.experience}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap size={16} className="text-teal-500" />
                    <span>Specialist</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3">{doctor.education}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm mt-8"
        >
          * Doctor profiles coming soon. Contact us to learn more about our team.
        </motion.p>
      </div>
    </section>
  );
}
