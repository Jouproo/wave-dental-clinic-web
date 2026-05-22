import { Phone, MapPin, Mail, Clock, Facebook, Instagram } from "lucide-react";
import Image from "next/image";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";

interface FooterProps {
  settings?: DbClinicSettings;
}

export default function Footer({ settings = defaultSettings }: FooterProps) {
  const year = new Date().getFullYear();
  const phone = settings.phone || clinicConfig.phoneNumber;
  const address = settings.address || clinicConfig.address;
  const workingHours = settings.working_hours || clinicConfig.workingHours;
  const facebook = settings.facebook_url || clinicConfig.socialLinks.facebook;
  const instagram = settings.instagram_url || clinicConfig.socialLinks.instagram;
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);

  return (
    <footer id="contact" className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image
                src="/images/web_logo.png"
                alt="Wave Dental Clinic"
                width={160}
                height={52}
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-sm leading-relaxed text-slate-400 mb-5">
              نقدم خدمات طب أسنان متكاملة بأعلى معايير الجودة والتعقيم في بيئة مريحة ومتقدمة.
            </p>
            <div className="flex gap-3">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors text-sm font-bold">
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
                  <a href={link.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
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
              {["تقويم الأسنان","زراعة الأسنان","تجميل الأسنان","تبييض الأسنان","علاج الجذور","طب أسنان الأطفال"].map((s) => (
                <li key={s}>
                  <a href="#services" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-400">{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href={`tel:${phone}`} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href={`mailto:${clinicConfig.email}`} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  {clinicConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-400">{workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© {year} {clinicConfig.clinicName}. جميع الحقوق محفوظة.</p>
          <p className="text-slate-600 text-xs">تصميم وتطوير احترافي لعيادات الأسنان</p>
        </div>
      </div>
    </footer>
  );
}
