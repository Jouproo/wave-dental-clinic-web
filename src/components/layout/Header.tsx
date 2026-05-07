"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import Image from "next/image";
import { clinicConfig, getWhatsAppUrl } from "@/config/clinic";

const navLinks = [
  { label: "الرئيسية", href: "#hero" },
  { label: "خدماتنا", href: "#services" },
  { label: "لماذا نحن؟", href: "#why-us" },
  { label: "أطباؤنا", href: "#doctors" },
  { label: "نتائج المرضى", href: "#results" },
  { label: "موقعنا", href: "#location" },
  { label: "تواصل معنا", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md shadow-blue-900/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <a
              href="#hero"
              onClick={(e) => { e.preventDefault(); handleNavClick("#hero"); }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Image
                src="/images/web_logo.png"
                alt="Wave Dental Clinic"
                width={140}
                height={44}
                className={`h-11 w-auto object-contain transition-all ${scrolled ? "" : "brightness-0 invert"}`}
                priority
              />
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all hover:bg-blue-50 hover:text-blue-700 ${
                    scrolled ? "text-slate-600" : "text-white/90 hover:text-blue-700"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={`tel:${clinicConfig.phoneNumber}`}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  scrolled ? "text-slate-600 hover:text-blue-600" : "text-white/90 hover:text-white"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>{clinicConfig.phoneNumber}</span>
              </a>
              <motion.a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="bg-gradient-to-l from-blue-600 to-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
              >
                احجز الآن
              </motion.a>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className={`w-6 h-6 ${scrolled ? "text-slate-800" : "text-white"}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? "text-slate-800" : "text-white"}`} />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 right-0 left-0 z-30 bg-white/98 backdrop-blur-lg shadow-xl border-t border-slate-100 overflow-hidden lg:hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                  className="text-slate-700 font-medium py-3 px-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <a
                  href={`tel:${clinicConfig.phoneNumber}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  {clinicConfig.phoneNumber}
                </a>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-blue-600 to-sky-500 text-white font-bold"
                >
                  احجز الآن
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
