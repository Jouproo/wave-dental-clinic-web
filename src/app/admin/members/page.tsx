"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, Loader2, ShieldCheck, Copy, Check } from "lucide-react";
import type { DbAdminUser } from "@/types/admin";

const SQL = `-- شغّل هذا الكود في Supabase SQL Editor مرة واحدة فقط
CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  password_hash TEXT      NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT now()
);`;

export default function MembersPage() {
  const [members, setMembers] = useState<DbAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      if (res.status === 500) {
        setTableError(true);
      } else {
        const data = await res.json();
        if (Array.isArray(data)) setMembers(data);
        else setTableError(true);
      }
    } catch {
      setTableError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "فشل الإضافة");
      }
      setForm({ email: "", name: "", password: "" });
      await load();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العضو؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "فشل الحذف");
        return;
      }
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">المسؤولون</h1>
      <p className="text-slate-500 mb-8">إدارة حسابات الدخول للوحة التحكم</p>

      {/* SQL setup banner */}
      {tableError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <p className="font-semibold text-amber-800 mb-1 text-sm">⚠ جدول المسؤولين غير موجود</p>
          <p className="text-amber-700 text-sm mb-3">
            شغّل هذا الكود مرة واحدة في{" "}
            <strong>Supabase → SQL Editor</strong> ثم أعد تحميل الصفحة:
          </p>
          <div className="relative bg-slate-900 rounded-xl p-4 text-left overflow-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre leading-relaxed">{SQL}</pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 left-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {!tableError && (
        <>
          {/* Current members */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-slate-700 text-sm">الحسابات الحالية ({members.length})</h2>
            </div>
            {members.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                لا يوجد حسابات بعد — أضف أول مسؤول أدناه
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{m.name}</p>
                        <p className="text-slate-400 text-xs" dir="ltr">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                        {m.role}
                      </span>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id || members.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-red-50"
                        title={members.length <= 1 ? "لا يمكن حذف آخر مسؤول" : "حذف"}
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add member form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-700 text-sm">إضافة مسؤول جديد</h2>
            </div>
            <form onSubmit={handleAdd} className="space-y-4" dir="rtl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">الاسم</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="input"
                    placeholder="محمد أحمد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="input"
                    placeholder="admin@clinic.com"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  كلمة المرور <span className="text-slate-400 font-normal">(8 أحرف على الأقل)</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  className="input"
                  placeholder="••••••••••"
                />
              </div>

              {addError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {addError}
                </p>
              )}

              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                إضافة مسؤول
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
