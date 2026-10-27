"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, Loader2, ShieldCheck, Copy, Check, Ban, CheckCircle, KeyRound, X } from "lucide-react";
import type { DbAdminUser } from "@/types/admin";

const SQL = `-- شغّل هذا الكود في Supabase SQL Editor مرة واحدة فقط
CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  password_hash TEXT      NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'admin',
  status      TEXT        NOT NULL DEFAULT 'active',
  allowed_branch_ids UUID[] NOT NULL DEFAULT '{}',
  extra_permissions TEXT[] NOT NULL DEFAULT '{}',
  manager_id  UUID        REFERENCES admin_users(id) ON DELETE SET NULL,
  scope_override TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- ثم شغّل ملف supabase/migrations/crm_schema_phase_a.sql لإضافة باقي أعمدة CRM.`;

const ROLE_LABELS: Record<string, string> = {
  admin: "أدمن", sales_manager: "مدير مبيعات", sales_agent: "مندوب مبيعات",
};

export default function MembersPage() {
  const [members, setMembers] = useState<DbAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "admin", manager_id: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [passwordEditId, setPasswordEditId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
        body: JSON.stringify({ ...form, manager_id: form.manager_id || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "فشل الإضافة");
      }
      setForm({ email: "", name: "", password: "", role: "admin", manager_id: "" });
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

  async function updateMember(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error ?? "فشل التعديل");
      return;
    }
    await load();
  }

  function openPasswordEdit(id: string) {
    setPasswordEditId(id);
    setNewPassword("");
    setPasswordError("");
  }

  function closePasswordEdit() {
    setPasswordEditId(null);
    setNewPassword("");
    setPasswordError("");
  }

  async function handleChangePassword(id: string) {
    if (newPassword.length < 8) {
      setPasswordError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setSavingPassword(true);
    setPasswordError("");
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPasswordError(d.error ?? "فشل تغيير كلمة المرور");
        return;
      }
      closePasswordEdit();
    } finally {
      setSavingPassword(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const managers = members.filter((m) => m.role === "admin" || m.role === "sales_manager");

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
      <p className="text-slate-500 mb-8">إدارة حسابات الدخول للوحة التحكم — الأدمن له وصول كامل، ومندوب/مدير المبيعات مقيّد بقسم CRM والحجوزات فقط</p>

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
                  <li key={m.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{m.name}</p>
                          <p className="text-slate-400 text-xs" dir="ltr">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={(e) => updateMember(m.id, { role: e.target.value })}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded-lg font-medium border-0 focus:ring-2 focus:ring-blue-300"
                        >
                          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        {m.role !== "admin" && (
                          <select
                            value={m.manager_id ?? ""}
                            onChange={(e) => updateMember(m.id, { manager_id: e.target.value || null })}
                            className="text-xs bg-gray-50 text-gray-600 px-2 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-blue-300"
                          >
                            <option value="">بدون مدير</option>
                            {managers.filter((mg) => mg.id !== m.id).map((mg) => (
                              <option key={mg.id} value={mg.id}>{mg.name || mg.email}</option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => (passwordEditId === m.id ? closePasswordEdit() : openPasswordEdit(m.id))}
                          title="تغيير كلمة المرور"
                          className={`p-1.5 rounded-lg transition-colors ${
                            passwordEditId === m.id ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateMember(m.id, { status: m.status === "active" ? "disabled" : "active" })}
                          title={m.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.status === "active" ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          {m.status === "active" ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
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
                    </div>

                    {passwordEditId === m.id && (
                      <div className="mt-3 flex flex-wrap items-start gap-2 bg-slate-50 rounded-xl p-3" dir="rtl">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="كلمة مرور جديدة (8 أحرف على الأقل)"
                          minLength={8}
                          autoFocus
                          className="input flex-1 min-w-[200px]"
                          onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(m.id); }}
                        />
                        <button
                          onClick={() => handleChangePassword(m.id)}
                          disabled={savingPassword}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg"
                        >
                          {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "حفظ"}
                        </button>
                        <button
                          onClick={closePasswordEdit}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {passwordError && (
                          <p className="w-full text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {passwordError}
                          </p>
                        )}
                      </div>
                    )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">الدور</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="input"
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                {form.role !== "admin" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">المدير المسؤول (اختياري)</label>
                    <select
                      value={form.manager_id}
                      onChange={(e) => setForm((f) => ({ ...f, manager_id: e.target.value }))}
                      className="input"
                    >
                      <option value="">بدون</option>
                      {managers.map((mg) => <option key={mg.id} value={mg.id}>{mg.name || mg.email}</option>)}
                    </select>
                  </div>
                )}
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
