"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Phone, MapPin, Clock, Link as LinkIcon } from "lucide-react";

type FormData = {
  phone: string;
  whatsapp: string;
  address: string;
  working_hours: string;
  google_maps_embed_url: string;
  google_maps_direction_url: string;
  facebook_url: string;
  instagram_url: string;
};

const empty: FormData = {
  phone: "",
  whatsapp: "",
  address: "",
  working_hours: "",
  google_maps_embed_url: "",
  google_maps_direction_url: "",
  facebook_url: "",
  instagram_url: "",
};

export default function ClinicSettingsPage() {
  const [form, setForm] = useState<FormData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/clinic")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          phone: d.phone ?? "",
          whatsapp: d.whatsapp ?? "",
          address: d.address ?? "",
          working_hours: d.working_hours ?? "",
          google_maps_embed_url: d.google_maps_embed_url ?? "",
          google_maps_direction_url: d.google_maps_direction_url ?? "",
          facebook_url: d.facebook_url ?? "",
          instagram_url: d.instagram_url ?? "",
        });
        setLoading(false);
      });
  }, []);

  function handleField(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMessage(res.ok ? "تم الحفظ بنجاح ✓" : "فشل الحفظ، حاول مرة أخرى");
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">إعدادات العيادة</h1>
      <p className="text-slate-500 mb-8">تحكم في بيانات التواصل والعنوان والموقع</p>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Contact */}
        <Section title="بيانات التواصل" icon={Phone}>
          <Field label="رقم الهاتف">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleField("phone", e.target.value)}
              className="input"
              placeholder="+201019575925"
              dir="ltr"
            />
          </Field>
          <Field label="رقم الواتساب">
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => handleField("whatsapp", e.target.value)}
              className="input"
              placeholder="+201019575925"
              dir="ltr"
            />
          </Field>
        </Section>

        {/* Address & Hours */}
        <Section title="العنوان ومواعيد العمل" icon={MapPin}>
          <Field label="عنوان العيادة">
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleField("address", e.target.value)}
              className="input"
              placeholder="6 أكتوبر، الجيزة، مصر"
            />
          </Field>
          <Field label="مواعيد العمل">
            <input
              type="text"
              value={form.working_hours}
              onChange={(e) => handleField("working_hours", e.target.value)}
              className="input"
              placeholder="مثال: السبت – الخميس: 10ص – 10م"
            />
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </Field>
        </Section>

        {/* Maps */}
        <Section title="خرائط جوجل" icon={MapPin}>
          <Field label="رابط الخريطة المضمنة (embed)" hint='افتح Google Maps → Share → Embed a map → انسخ src="..." فقط'>
            <textarea
              value={form.google_maps_embed_url}
              onChange={(e) => handleField("google_maps_embed_url", e.target.value)}
              rows={2}
              className="input resize-none text-xs"
              placeholder="https://maps.google.com/maps?q=..."
              dir="ltr"
            />
          </Field>
          <Field label="رابط الاتجاهات (directions)">
            <input
              type="text"
              value={form.google_maps_direction_url}
              onChange={(e) => handleField("google_maps_direction_url", e.target.value)}
              className="input"
              placeholder="https://maps.app.goo.gl/..."
              dir="ltr"
            />
          </Field>
        </Section>

        {/* Social */}
        <Section title="وسائل التواصل الاجتماعي" icon={LinkIcon}>
          <Field label="فيسبوك">
            <input
              type="url"
              value={form.facebook_url}
              onChange={(e) => handleField("facebook_url", e.target.value)}
              className="input"
              placeholder="https://www.facebook.com/..."
              dir="ltr"
            />
          </Field>
          <Field label="إنستجرام">
            <input
              type="url"
              value={form.instagram_url}
              onChange={(e) => handleField("instagram_url", e.target.value)}
              className="input"
              placeholder="https://www.instagram.com/..."
              dir="ltr"
            />
          </Field>
        </Section>

        {message && (
          <p className={`text-sm font-medium ${message.includes("فشل") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
      </form>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <h2 className="font-semibold text-slate-700 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="relative">{children}</div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
