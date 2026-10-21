"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, X, FileText, Loader2, CheckCircle2, AlertCircle,
  User, Phone, Calendar, Clock, MessageSquare, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface ServiceOption {
  id: string;
  title: string;
}

interface BookingFormProps {
  mode: "appointment" | "implant_diagnosis";
  services?: ServiceOption[];
}

interface PendingFile {
  file: File;
  previewUrl: string | null;
}

const MAX_FILES = 5;

export default function BookingForm({ mode, services = [] }: BookingFormProps) {
  const isDiagnosis = mode === "implant_diagnosis";
  const fileRef = useRef<HTMLInputElement>(null);
  const [renderedAt] = useState(() => Date.now());

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — real users never see this field

  const [files, setFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= MAX_FILES) break;
        next.push({
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        });
      }
      return next;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("من فضلك أدخل اسمك");
    if (phone.replace(/\D/g, "").length < 9) return setError("من فضلك أدخل رقم هاتف صحيح");
    if (isDiagnosis && files.length === 0) return setError("من فضلك ارفع صورة أشعة واحدة على الأقل");
    if (isDiagnosis && !consent) return setError("من فضلك وافق على إرسال بياناتك الطبية لمراجعة الطبيب");

    setSubmitting(true);
    try {
      // Upload sequentially (not in parallel) to keep server-side memory
      // usage predictable on the Heroku dyno — one buffered file at a time.
      const xrayPaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadLabel(`جاري رفع الملف ${i + 1} من ${files.length}...`);
        const fd = new FormData();
        fd.append("file", files[i].file);
        const res = await fetch("/api/upload/xray", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "فشل رفع الملف");
        xrayPaths.push(data.path);
      }
      setUploadLabel("");

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: mode,
          name: name.trim(),
          phone: phone.trim(),
          age: isDiagnosis && age ? Number(age) : undefined,
          service_id: !isDiagnosis && serviceId ? serviceId : undefined,
          preferred_date: !isDiagnosis ? preferredDate : undefined,
          preferred_time: !isDiagnosis ? preferredTime : undefined,
          message: message.trim(),
          xray_paths: xrayPaths,
          consent_given: consent,
          website,
          rendered_at: renderedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ أثناء الإرسال");

      trackAnalyticsEvent("booking_start", {
        cta_location: isDiagnosis ? "implant_diagnosis_form" : "booking_form",
        page_type: isDiagnosis ? "implant_diagnosis" : "booking",
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الإرسال");
    } finally {
      setSubmitting(false);
      setUploadLabel("");
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[1.75rem] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] p-8 sm:p-10 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-black text-ink-900 mb-3">تم إرسال طلبك بنجاح</h3>
        <p className="text-ink-500 leading-relaxed max-w-md mx-auto">
          {isDiagnosis
            ? "فريقنا الطبي هيراجع بياناتك والأشعة، وهنتواصل معاك عبر واتساب أو مكالمة خلال 24-48 ساعة بنتيجة التشخيص الأولي."
            : "فريق العيادة هيتواصل معاك قريبًا لتأكيد الموعد. لو محتاج رد أسرع، تقدر تتواصل معانا مباشرة عبر واتساب."}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[1.75rem] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-5">
      {/* Honeypot — visually hidden via the standard clip technique (not
          display:none, which some bots skip, and not a huge negative offset,
          which blows out document scrollWidth on an RTL page). */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">اتركه فارغًا</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="الاسم بالكامل" icon={User} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="booking-input"
            placeholder="اكتب اسمك"
          />
        </FormField>
        <FormField label="رقم الهاتف / واتساب" icon={Phone} required>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            dir="ltr"
            className="booking-input text-right"
            placeholder="01xxxxxxxxx"
          />
        </FormField>
      </div>

      {isDiagnosis ? (
        <>
          <FormField label="العمر (اختياري)" icon={User}>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="booking-input"
              placeholder="مثال: 35"
            />
          </FormField>
          <FormField label="وصف الحالة" icon={MessageSquare}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="booking-input resize-none"
              placeholder="اكتب أي تفاصيل تساعد الطبيب: الأسنان المفقودة، مدة الفقد، أمراض مزمنة (سكر، ضغط)، تدخين، إلخ."
            />
          </FormField>
        </>
      ) : (
        <>
          {services.length > 0 && (
            <FormField label="الخدمة المطلوبة (اختياري)" icon={MessageSquare}>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="booking-input">
                <option value="">اختر خدمة...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </FormField>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="التاريخ المفضل (اختياري)" icon={Calendar}>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="booking-input"
              />
            </FormField>
            <FormField label="الوقت المفضل (اختياري)" icon={Clock}>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="booking-input"
                placeholder="مثال: بعد الظهر"
              />
            </FormField>
          </div>
          <FormField label="ملاحظات إضافية (اختياري)" icon={MessageSquare}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="booking-input resize-none"
              placeholder="أي تفاصيل تحب تضيفها..."
            />
          </FormField>
        </>
      )}

      {/* X-ray upload */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-2">
          <FileText className="w-4 h-4 text-brand-500" />
          {isDiagnosis ? "صور الأشعة" : "أشعة (اختياري)"}
          {isDiagnosis && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={handleFilesPicked}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className="flex items-center gap-2 px-4 py-2.5 border border-brand-200 text-brand-700 rounded-xl hover:bg-brand-50 text-sm font-semibold transition-colors disabled:opacity-40"
        >
          <Upload className="w-4 h-4" />
          اختر ملفات (صورة أو PDF)
        </button>
        <p className="text-xs text-ink-500 mt-1.5">حتى {MAX_FILES} ملفات، كل ملف أقل من 5 ميجابايت.</p>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 bg-mist-50 rounded-xl px-3 py-2">
                {f.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a Next/Image-optimizable remote asset
                  <img src={f.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-500" />
                  </div>
                )}
                <span className="text-sm text-ink-700 truncate flex-1">{f.file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="p-1.5 text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isDiagnosis && (
        <label className="flex items-start gap-3 bg-mist-50 rounded-xl p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-600 flex-shrink-0"
          />
          <span className="text-sm text-ink-600 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-brand-500 inline-block ml-1 -mt-0.5" />
            أوافق على إرسال بياناتي وصور الأشعة لمراجعتها من قِبل أطباء العيادة بغرض التشخيص الأولي فقط، وأتفهم أن هذا التشخيص لا يغني عن الكشف الطبي المباشر.
          </span>
        </label>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white shadow-lg shadow-brand-600/25 transition-all",
          submitting ? "bg-brand-400" : "bg-gradient-to-l from-brand-600 to-brand-400 hover:shadow-xl hover:shadow-brand-600/40"
        )}
      >
        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {submitting ? (uploadLabel || "جاري الإرسال...") : isDiagnosis ? "أرسل بياناتي للتشخيص المجاني" : "أرسل طلب الحجز"}
      </button>
    </form>
  );
}

function FormField({
  label, icon: Icon, required, children,
}: { label: string; icon: React.ComponentType<{ className?: string }>; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-1.5">
        <Icon className="w-4 h-4 text-brand-500" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
