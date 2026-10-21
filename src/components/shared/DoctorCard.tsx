"use client";

import { motion } from "framer-motion";
import { UserCircle, Award, MessageCircle } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl } from "@/lib/clinic-settings";
import type { Doctor } from "@/data/doctors";
import Image from "next/image";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
  clinicWhatsapp?: string;
}

export default function DoctorCard({ doctor, index, clinicWhatsapp }: DoctorCardProps) {
  const whatsappNumber = doctor.whatsapp || clinicWhatsapp || clinicConfig.whatsappNumber;
  const whatsappUrl = makeWhatsAppUrl(whatsappNumber, `أريد حجز موعد مع ${doctor.name}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="group bg-white rounded-[1.75rem] overflow-hidden shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_44px_-14px_rgba(22,114,214,0.3)] transition-all duration-300 border border-slate-100"
    >
      {/* Doctor image — aspect-[4/5] matches the clinic's near-square headshot
          crop (uploaded via admin); the old fixed h-64 was wider than the
          source photos and cropped into foreheads/hair on desktop cards. */}
      <div className="aspect-[4/5] bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center relative overflow-hidden">
        {doctor.image_url ? (
          <Image
            src={doctor.image_url}
            alt={`${doctor.name} — ${doctor.specialty}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <UserCircle className="w-28 h-28 text-brand-300" strokeWidth={1.2} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-ink-900/0 to-transparent" />
        <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-brand-700 text-xs font-bold px-3 py-1 rounded-full z-10">
          {doctor.experience}
        </span>
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-300 font-semibold">{doctor.specialty}</span>
          </div>
          <h3 className="text-xl font-bold text-white">{doctor.name}</h3>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        {/* Fixed-height bio (4 lines, clamped) so the button below lines up
            at the same spot across every doctor card regardless of bio length. */}
        <p className="text-ink-500 text-sm leading-relaxed mb-4 line-clamp-4 min-h-[6rem]">{doctor.bio}</p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "doctor_section", page_type: "home" })}
          className="flex items-center justify-center gap-2 w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3 rounded-2xl transition-colors text-sm border border-green-200"
        >
          <MessageCircle className="w-4 h-4" />
          <span>احجز مع الدكتور</span>
        </a>
      </div>
    </motion.div>
  );
}
