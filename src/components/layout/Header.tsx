"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
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
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md shadow-blue-900/5"
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
                className={`h-12 w-auto object-contain transition-all ${scrolled ? "" : "brightness-0 invert"}`}
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) =>
                link.href ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium px-3 py-2 rounded-lg transition-all hover:bg-blue-50 hover:text-blue-700 ${
                      scrolled ? "text-slate-600" : "text-white/90 hover:text-blue-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.hash}
                    href={isHome ? link.hash : `/${link.hash}`}
                    onClick={(e) => { e.preventDefault(); handleNavClick(link.hash!); }}
                    className={`text-sm font-medium px-3 py-2 rounded-lg transition-all hover:bg-blue-50 hover:text-blue-700 ${
                      scrolled ? "text-slate-600" : "text-white/90 hover:text-blue-700"
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
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  scrolled ? "text-slate-600 hover:text-blue-600" : "text-white/90 hover:text-white"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span dir="ltr">{phone}</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "header", page_type: pageType })}
                className="bg-gradient-to-l from-blue-600 to-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
              >
                احجز الآن
              </a>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen
                ? <X className={`w-6 h-6 ${scrolled ? "text-slate-800" : "text-white"}`} />
                : <Menu className={`w-6 h-6 ${scrolled ? "text-slate-800" : "text-white"}`} />
              }
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
            transition={{ duration: 0.25 }}
            className="fixed top-16 right-0 left-0 z-30 bg-white/98 backdrop-blur-lg shadow-xl border-t border-slate-100 overflow-hidden lg:hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) =>
                link.href ? (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block text-slate-700 font-medium py-3 px-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={link.hash}
                    href={isHome ? link.hash : `/${link.hash}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={(e) => { e.preventDefault(); handleNavClick(link.hash!); }}
                    className="text-slate-700 font-medium py-3 px-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {link.label}
                  </motion.a>
                )
              )}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <a
                  href={`tel:${phone}`}
                  onClick={() => trackAnalyticsEvent("phone_click", { contact_method: "phone", cta_location: "mobile_menu", page_type: pageType })}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{phone}</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "mobile_menu", page_type: pageType })}
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
