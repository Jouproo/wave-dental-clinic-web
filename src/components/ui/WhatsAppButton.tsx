"use client";

import { MessageCircle } from "lucide-react";
import { clinicConfig } from "@/config/clinic";

export default function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(clinicConfig.whatsappMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:shadow-green-200 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={28} className="fill-white" />
      <span className="absolute right-16 bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200">
        Chat with us
      </span>
    </a>
  );
}
