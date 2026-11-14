"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X, Share, SquarePlus, MoreVertical, CheckCircle2 } from "lucide-react";

/**
 * "ثبت التطبيق" — installs the admin dashboard as a home-screen app.
 *
 * - Chrome / Edge / Android: the browser fires `beforeinstallprompt`; we hold
 *   on to it and replay it when the button is tapped (one tap → native dialog).
 * - iPhone / iPad Safari: Apple exposes no install API, so the button opens
 *   short instructions (Share → Add to Home Screen) instead.
 * - Already running as the installed app: the button hides itself.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ---- module-level store: the event can fire before any button mounts, so capture it once, globally ----
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // keep it for our own button instead of the browser's mini-infobar
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener?.("change", cb);
  return () => { listeners.delete(cb); mq.removeEventListener?.("change", cb); };
}

type InstallMode = "prompt" | "ios" | "android-manual" | "hidden";

function getMode(): InstallMode {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  if (installed || standalone) return "hidden";
  if (deferredPrompt) return "prompt";
  const ua = nav.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  if (isIOS) return "ios";
  // Android browsers that don't (yet) fire the event still offer "Add to Home screen" in their menu.
  if (/android/i.test(ua)) return "android-manual";
  return "hidden"; // desktop browser without install support — nothing useful to offer
}

function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, getMode, () => "hidden");
}

export default function InstallAppButton({ variant = "sidebar" }: { variant?: "sidebar" | "topbar" | "login" }) {
  const mode = useInstallMode();
  const [guide, setGuide] = useState<null | "ios" | "android-manual">(null);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const onInstalled = () => { setJustInstalled(true); setTimeout(() => setJustInstalled(false), 4000); };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  async function install() {
    if (mode === "prompt" && deferredPrompt) {
      const evt = deferredPrompt;
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      // A prompt can only be used once; the browser fires a fresh event later if they dismissed it.
      deferredPrompt = null;
      if (outcome === "accepted") installed = true;
      emit();
    } else if (mode === "ios" || mode === "android-manual") {
      setGuide(mode);
    }
  }

  if (justInstalled) {
    return (
      <div role="status" className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-4 z-[60] flex items-center gap-2 bg-green-600 text-white text-sm font-semibold rounded-xl px-4 py-3 shadow-lg">
        <CheckCircle2 className="w-4 h-4" /> تم تثبيت التطبيق — هتلاقيه على الشاشة الرئيسية
      </div>
    );
  }
  if (mode === "hidden") return null;

  const button =
    variant === "topbar" ? (
      <button onClick={install} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm active:scale-95 transition">
        <Download className="w-3.5 h-3.5" /> ثبت التطبيق
      </button>
    ) : variant === "login" ? (
      // Sits in the login page flow under the card, styled for its dark glass theme.
      <button onClick={install} className="mt-5 flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold backdrop-blur active:scale-95 transition">
        <Download className="w-4 h-4" /> ثبت التطبيق على موبايلك
      </button>
    ) : (
      <button onClick={install} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors w-full">
        <Download className="w-4 h-4 flex-shrink-0" />
        ثبت التطبيق
      </button>
    );

  return (
    <>
      {button}
      {guide && <InstallGuide kind={guide} onClose={() => setGuide(null)} />}
    </>
  );
}

function InstallGuide({ kind, onClose }: { kind: "ios" | "android-manual"; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const steps = kind === "ios"
    ? [
        { icon: Share, text: <>اضغط زرار <b>المشاركة</b> (المربع اللي طالع منه سهم) — في Safari تحت، وفي Chrome جنب العنوان فوق</> },
        { icon: SquarePlus, text: <>انزل واختار <b>«إضافة إلى الشاشة الرئيسية»</b> <span dir="ltr" className="inline-block text-slate-400 text-xs">Add to Home Screen</span></> },
        { icon: CheckCircle2, text: <>اضغط <b>«إضافة»</b> — أيقونة Wave هتظهر على الشاشة الرئيسية</> },
      ]
    : [
        { icon: MoreVertical, text: <>افتح قائمة المتصفح <b>⋮</b> (فوق على الجنب)</> },
        { icon: SquarePlus, text: <>اختار <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b></> },
        { icon: CheckCircle2, text: <>أكّد — أيقونة Wave هتظهر على الشاشة الرئيسية</> },
      ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose} dir="rtl">
      <div
        role="dialog" aria-modal="true" aria-label="تثبيت التطبيق"
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static app icon */}
            <img src="/icons/admin-icon-192.png" alt="" className="w-12 h-12 rounded-xl" />
            <div>
              <h3 className="font-bold text-slate-800">ثبت تطبيق Wave</h3>
              <p className="text-xs text-slate-500">يفتح على طول من الشاشة الرئيسية، من غير المتصفح</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <s.icon className="w-4 h-4" />
              </span>
              <span className="text-sm text-slate-700 leading-relaxed pt-1">{s.text}</span>
            </li>
          ))}
        </ol>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold">تمام</button>
      </div>
    </div>
  );
}
