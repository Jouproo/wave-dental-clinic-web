"use client";

import { motion } from "framer-motion";
import { UserCircle, Award, MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/config/clinic";
import type { Doctor } from "@/data/doctors";
import Image from "next/image";

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
}

export default function DoctorCard({ doctor, index }: DoctorCardProps) {
  const whatsappUrl = doctor.whatsapp
    ? `https://wa.me/${doctor.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`أريد حجز موعد مع ${doctor.name}`)}`
    : getWhatsAppUrl(`أريد حجز موعد مع ${doctor.name}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      {/* Doctor image */}
      <div className="h-52 bg-gradient-to-br from-blue-100 to-sky-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-sky-500/10" />
        {doctor.image_url ? (
          <Image
            src={doctor.image_url}
            alt={doctor.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <UserCircle className="w-28 h-28 text-blue-300" strokeWidth={1.2} />
        )}
        <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
          {doctor.experience}
        </span>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-600 font-semibold">{doctor.specialty}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{doctor.name}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">{doctor.bio}</p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2.5 rounded-xl transition-colors text-sm border border-green-200"
        >
          <MessageCircle className="w-4 h-4" />
          <span>احجز مع الدكتور</span>
        </a>
      </div>
    </motion.div>
  );
}
