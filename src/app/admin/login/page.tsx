"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
      } else {
        const data = await res.json();
        setError(data.error ?? "كلمة المرور غير صحيحة");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600" />

          <div className="px-8 pt-8 pb-9">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              {/* Logo mark */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                <span className="text-white text-3xl font-black leading-none">W</span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">لوحة التحكم</h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">Wave Dental Clinic</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-100" />
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                دخول آمن
              </div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all pr-4 pl-11 placeholder:text-slate-300"
                    placeholder="••••••••••••"
                    required
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">!</span>
                  </div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "دخول للوحة التحكم"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/30 mt-5">
          © {new Date().getFullYear()} Wave Dental Clinic — Admin Portal
        </p>
      </div>
    </div>
  );
}
