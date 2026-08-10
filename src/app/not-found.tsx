import Link from "next/link";
import { MessageCircle, Home, Search } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { clinicConfig, getWhatsAppUrl } from "@/config/clinic";

export const metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-28">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-7xl font-black bg-gradient-to-l from-blue-600 to-sky-500 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            الصفحة اللي بتدور عليها مش موجودة
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            يمكن يكون الرابط اتغيّر أو الصفحة اتنقلت. تقدر ترجع للرئيسية أو تتواصل معنا مباشرة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-gradient-to-l from-blue-600 to-sky-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>
            <Link
              href="/#services"
              className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-6 py-3.5 rounded-xl transition-colors border border-blue-200"
            >
              <Search className="w-4 h-4" />
              تصفح خدماتنا
            </Link>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل عبر واتساب
            </a>
          </div>
          <p className="text-slate-400 text-xs mt-8" dir="ltr">
            {clinicConfig.phoneNumber}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
