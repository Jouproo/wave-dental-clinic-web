"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { clinicConfig } from "@/config/clinic";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Doctors", href: "#doctors" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#location" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span
              className={`text-xl font-bold transition-colors duration-300 ${
                scrolled ? "text-blue-800" : "text-white"
              }`}
            >
              Wave Dental
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 hover:text-teal-500 ${
                  scrolled ? "text-gray-700" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href={`tel:${clinicConfig.phoneNumber}`}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-200 ${
                scrolled ? "text-blue-700" : "text-white/90"
              }`}
            >
              <Phone size={16} />
              <span>{clinicConfig.phoneNumber}</span>
            </a>
            <a
              href={clinicConfig.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Book Now
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X
                size={24}
                className={scrolled ? "text-gray-700" : "text-white"}
              />
            ) : (
              <Menu
                size={24}
                className={scrolled ? "text-gray-700" : "text-white"}
              />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 font-medium py-2 hover:text-teal-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={clinicConfig.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-to-r from-blue-600 to-teal-500 text-white px-5 py-3 rounded-full font-semibold mt-2"
            >
              Book Appointment
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
