"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl } from "@/lib/clinic-settings";

interface FloatingWhatsAppButtonProps {
  whatsapp?: string;
}

export default function FloatingWhatsAppButton({ whatsapp }: FloatingWhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const url = makeWhatsAppUrl(whatsapp || clinicConfig.whatsappNumber);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Tooltip — absolutely positioned, never shifts the button */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-16 left-0 bg-white rounded-2xl shadow-xl px-4 py-3 w-52 border border-green-100 pointer-events-none"
          >
            <p className="text-slate-700 text-sm font-medium leading-snug">
              احجز موعدك الآن عبر واتساب! 👋
            </p>
            <p className="text-slate-400 text-xs mt-1">{clinicConfig.clinicName}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا على واتساب"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center hover:shadow-green-500/60 transition-shadow"
      >
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
        <MessageCircle className="w-7 h-7 text-white" fill="white" />
      </motion.a>
    </div>
  );
}
