import { Phone, MapPin, Mail, Clock, Facebook, Instagram } from "lucide-react";
import { clinicConfig, getWhatsAppUrl } from "@/config/clinic";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-lg font-black">ع</span>
              </div>
              <span className="text-white font-bold text-lg">{clinicConfig.clinicName}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 mb-5">
              نقدم خدمات طب أسنان متكاملة بأعلى معايير الجودة والتعقيم في بيئة مريحة ومتقدمة.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {clinicConfig.socialLinks.facebook && (
                <a
                  href={clinicConfig.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {clinicConfig.socialLinks.instagram && (
                <a
                  href={clinicConfig.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors text-sm font-bold"
              >
                W
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2">
              {[
                { label: "الرئيسية", href: "#hero" },
                { label: "خدماتنا", href: "#services" },
                { label: "لماذا نحن؟", href: "#why-us" },
                { label: "أطباؤنا", href: "#doctors" },
                { label: "الأسئلة الشائعة", href: "#faq" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">خدماتنا</h4>
            <ul className="space-y-2">
              {[
                "تقويم الأسنان",
                "زراعة الأسنان",
                "تجميل الأسنان",
                "تبييض الأسنان",
                "علاج الجذور",
                "طب أسنان الأطفال",
              ].map((s) => (
                <li key={s}>
                  <a href="#services" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-400">{clinicConfig.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href={`tel:${clinicConfig.phoneNumber}`} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  {clinicConfig.phoneNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href={`mailto:${clinicConfig.email}`} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  {clinicConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-400">{clinicConfig.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {year} {clinicConfig.clinicName}. جميع الحقوق محفوظة.
          </p>
          <p className="text-slate-600 text-xs">
            تصميم وتطوير احترافي لعيادات الأسنان
          </p>
        </div>
      </div>
    </footer>
  );
}
