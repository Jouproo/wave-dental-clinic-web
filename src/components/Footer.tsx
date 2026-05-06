import { clinicConfig } from "@/config/clinic";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Doctors", href: "#doctors" },
  { label: "Results", href: "#results" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Location", href: "#location" },
  { label: "FAQ", href: "#faq" },
];

export default function Footer() {
  const whatsappUrl = `https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(clinicConfig.whatsappMessage)}`;

  return (
    <footer className="bg-blue-950 text-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-white font-bold text-xl">Wave Dental</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed mb-5">
              Professional dental care with a personal touch. Your smile is our
              passion.
            </p>
            <div className="flex gap-3">
              <a
                href={clinicConfig.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href={clinicConfig.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href={clinicConfig.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>
              <a
                href={clinicConfig.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-blue-200 hover:text-teal-300 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              {[
                "Cosmetic Dentistry",
                "Orthodontics",
                "Teeth Whitening",
                "Dental Implants",
                "Preventive Care",
                "Root Canal",
                "Emergency Dental",
              ].map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm text-blue-200">
              <div className="flex gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5 text-teal-400" />
                <span>{clinicConfig.address}</span>
              </div>
              <div className="flex gap-2">
                <Phone size={16} className="shrink-0 text-teal-400" />
                <a
                  href={`tel:${clinicConfig.phoneNumber}`}
                  className="hover:text-teal-300 transition-colors"
                >
                  {clinicConfig.phoneNumber}
                </a>
              </div>
              <div className="flex gap-2">
                <Mail size={16} className="shrink-0 text-teal-400" />
                <a
                  href={`mailto:${clinicConfig.email}`}
                  className="hover:text-teal-300 transition-colors"
                >
                  {clinicConfig.email}
                </a>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-blue-300">
          <p>
            © {new Date().getFullYear()} {clinicConfig.clinicName}. All rights
            reserved.
          </p>
          <p>
            <a
              href={`https://${clinicConfig.domain}`}
              className="hover:text-teal-300 transition-colors"
            >
              {clinicConfig.domain}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
