"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { getWhatsAppUrl, clinicConfig } from "@/config/clinic";

export default function FloatingWhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl px-4 py-3 max-w-[220px] border border-green-100"
          >
            <p className="text-slate-700 text-sm font-medium leading-snug">
              احجز موعدك الآن عبر واتساب! 👋
            </p>
            <p className="text-slate-400 text-xs mt-1">{clinicConfig.clinicName}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا على واتساب"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center hover:shadow-green-500/60 transition-shadow"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
        <MessageCircle className="w-7 h-7 text-white" fill="white" />
      </motion.a>
    </div>
  );
}
