"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { Menu, X, Phone, MessageCircle, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";
import { trackAnalyticsEvent, derivePageType } from "@/lib/analytics";

const navLinks: { label: string; hash?: string; href?: string }[] = [
  { label: "الرئيسية",   hash: "#hero" },
  { label: "خدماتنا",    hash: "#services" },
  { label: "لماذا نحن؟", hash: "#why-us" },
  { label: "أطباؤنا",    hash: "#doctors" },
  { label: "نتائج المرضى", hash: "#results" },
  { label: "دليل الأسنان", href: "/blog" },
  { label: "موقعنا",     hash: "#location" },
  { label: "تواصل معنا", hash: "#contact" },
];

interface HeaderProps {
  settings?: DbClinicSettings;
}

export default function Header({ settings = defaultSettings }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollYProgress } = useScroll();

  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = !isHome || scrollY > 20; // internal pages always "scrolled"

  const phone = settings.phone || clinicConfig.phoneNumber;
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);
  const pageType = derivePageType(pathname);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [menuOpen]);

  function handleNavClick(hash: string) {
    setMenuOpen(false);
    if (isHome) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/${hash}`;
    }
  }

  return (
    <>
      {/* Scroll progress indicator */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 right-0 left-0 h-[3px] origin-right bg-gradient-to-l from-brand-400 via-brand-600 to-brand-900 z-[60]"
      />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.06),0_12px_30px_-10px_rgba(15,23,42,0.12)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo — goes to / from any page */}
            <Link
              href="/"
              onClick={(e) => { if (isHome) { e.preventDefault(); handleNavClick("#hero"); } }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Image
                src="/images/web_logo.png"
                alt="Wave Dental Clinic"
                width={160}
                height={50}
                className={`h-11 md:h-12 w-auto object-contain transition-all ${scrolled ? "" : "brightness-0 invert"}`}
                priority
              />
            </Link>

            {/* Desktop Nav — floating pill */}
            <nav
              className={`hidden lg:flex items-center gap-0.5 rounded-full p-1 transition-colors duration-300 ${
                scrolled ? "bg-slate-100/70" : "bg-white/10 backdrop-blur-sm border border-white/15"
              }`}
            >
              {navLinks.map((link) =>
                link.href ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-semibold px-3.5 py-2 rounded-full transition-all ${
                      scrolled
                        ? "text-ink-600 hover:bg-white hover:text-brand-700 hover:shadow-sm"
                        : "text-white/90 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.hash}
                    href={isHome ? link.hash : `/${link.hash}`}
                    onClick={(e) => { e.preventDefault(); handleNavClick(link.hash!); }}
                    className={`text-sm font-semibold px-3.5 py-2 rounded-full transition-all ${
                      scrolled
                        ? "text-ink-600 hover:bg-white hover:text-brand-700 hover:shadow-sm"
                        : "text-white/90 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={`tel:${phone}`}
                onClick={() => trackAnalyticsEvent("phone_click", { contact_method: "phone", cta_location: "header", page_type: pageType })}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  scrolled ? "text-ink-600 hover:text-brand-600" : "text-white/90 hover:text-white"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span dir="ltr">{phone}</span>
              </a>
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "header", page_type: pageType })}
                className="bg-gradient-to-l from-brand-600 to-brand-400 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 transition-shadow"
              >
                احجز الآن
              </motion.a>
            </div>

            {/* Mobile toggle */}
            <button
              className={`lg:hidden relative w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${
                scrolled ? "text-ink-800" : "text-white"
              } ${menuOpen ? "bg-brand-600 text-white" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="فتح القائمة"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu — full-screen overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 lg:hidden bg-ink-900/95 backdrop-blur-xl bg-noise overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 h-16">
              <Image
                src="/images/web_logo.png"
                alt="Wave Dental Clinic"
                width={140}
                height={44}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
              <button
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white"
                onClick={() => setMenuOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-5 sm:px-6 pt-6 pb-10 flex flex-col">
              {navLinks.map((link, i) =>
                link.href ? (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    className="border-b border-white/10"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-4 text-xl font-bold text-white/90 hover:text-white transition-colors"
                    >
                      {link.label}
                      <ChevronLeft className="w-5 h-5 text-white/30" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={link.hash}
                    href={isHome ? link.hash : `/${link.hash}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    onClick={(e) => { e.preventDefault(); handleNavClick(link.hash!); }}
                    className="flex items-center justify-between py-4 text-xl font-bold text-white/90 hover:text-white border-b border-white/10 transition-colors"
                  >
                    {link.label}
                    <ChevronLeft className="w-5 h-5 text-white/30" />
                  </motion.a>
                )
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-col gap-3"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "mobile_menu", page_type: pageType })}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-l from-green-600 to-[#25D366] text-white font-bold text-base shadow-lg shadow-green-900/30"
                >
                  <MessageCircle className="w-5 h-5" />
                  احجز عبر واتساب
                </a>
                <a
                  href={`tel:${phone}`}
                  onClick={() => trackAnalyticsEvent("phone_click", { contact_method: "phone", cta_location: "mobile_menu", page_type: pageType })}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl glass-dark text-white font-semibold text-base"
                >
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{phone}</span>
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
