import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import TrackedLink from "@/components/analytics/TrackedLink";
import { getClinicSettings, makeWhatsAppUrl } from "@/lib/clinic-settings";
import { clinicConfig } from "@/config/clinic";

export const revalidate = 3600;

const LAST_UPDATED = "4 أكتوبر 2026";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لعيادة ويف لطب الأسنان — إيه البيانات اللي بنجمعها، وإزاي بنستخدمها ونحميها، وإيه حقوقك فيها.",
  alternates: { canonical: "/privacy-policy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">{title}</h2>
      <div className="space-y-3 text-slate-700 leading-loose">{children}</div>
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pr-6 space-y-2 marker:text-blue-500">{children}</ul>;
}

export default async function PrivacyPolicyPage() {
  const settings = await getClinicSettings();
  const phone = settings.phone || clinicConfig.phoneNumber;
  const whatsapp = settings.whatsapp || clinicConfig.whatsappNumber;
  const address = settings.address || clinicConfig.address;
  const whatsappUrl = makeWhatsAppUrl(whatsapp, "مرحبًا، عندي استفسار بخصوص سياسة الخصوصية وبياناتي.");

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header settings={settings} />
      <main className="pt-24 pb-[68px] md:pb-0">
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 md:py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-5">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              خصوصيتك تهمنا
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">سياسة الخصوصية</h1>
            <p className="text-white/60 text-sm">آخر تحديث: {LAST_UPDATED}</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-base md:text-lg">
          <p className="text-slate-700 leading-loose">
            في <strong>عيادة ويف لطب الأسنان (Wave Dental Clinic)</strong> بمدينة 6 أكتوبر، بنحترم خصوصيتك وبنتعامل مع بياناتك الشخصية بمسؤولية. السياسة دي بتوضح إيه البيانات اللي بنجمعها، وإزاي بنستخدمها ونحميها، وإيه حقوقك فيها، وذلك عند استخدامك لموقعنا أو تواصلك معانا من خلال الإعلانات أو الواتساب أو التليفون أو نماذج الحجز.
          </p>

          <Section title="1. البيانات اللي بنجمعها">
            <List>
              <li><strong>بيانات التواصل:</strong> الاسم، رقم الموبايل، رقم الواتساب، والبريد الإلكتروني (لو اتكتب).</li>
              <li><strong>بيانات الحجز والاستفسار:</strong> نوع الخدمة المطلوبة (زي زراعة الأسنان)، المنطقة، والمعاد المناسب ليك، وأي تفاصيل بتكتبها بنفسك في رسالتك.</li>
              <li><strong>بيانات من نماذج الإعلانات:</strong> لما تملا نموذج تواصل داخل إعلان على Google أو Meta (فيسبوك/إنستجرام)، البيانات اللي بتكتبها بتوصلنا علشان نتواصل معاك.</li>
              <li><strong>بيانات الاستخدام التقنية:</strong> زي نوع الجهاز والمتصفح، والصفحات اللي زرتها، ومصدر الزيارة، وده من خلال ملفات تعريف الارتباط (Cookies) وأدوات القياس.</li>
            </List>
            <p>
              إحنا <strong>مش بنطلب</strong> من خلال الموقع أو الإعلانات أي بيانات طبية تفصيلية أو مستندات شخصية. أي معلومات طبية بتتاخد بس جوه العيادة وقت الكشف، وبتتعامل بسرية تامة.
            </p>
          </Section>

          <Section title="2. بنستخدم بياناتك في إيه">
            <List>
              <li>التواصل معاك للرد على استفسارك أو تأكيد معاد الكشف.</li>
              <li>توضيح الخدمات والأسعار والعروض اللي سألت عليها.</li>
              <li>تذكيرك بمواعيدك ومتابعة حالتك بعد الزيارة.</li>
              <li>تحسين خدماتنا وموقعنا وقياس أداء حملاتنا الإعلانية.</li>
            </List>
            <p>مش هنبعتلك رسايل تسويقية إلا لو انت تواصلت معانا أو وافقت على كده، وتقدر توقفها في أي وقت.</p>
          </Section>

          <Section title="3. ملفات تعريف الارتباط وأدوات القياس">
            <p>
              موقعنا ممكن يستخدم أدوات زي <strong>Google Analytics</strong> و<strong>Google Ads</strong> و<strong>Meta Pixel</strong> لقياس الزيارات ومعرفة أنهي إعلان جاب التواصل (زي الضغط على زرار الاتصال أو الواتساب). الأدوات دي بتجمع بيانات تقنية مجمّعة ومش بتدينا اسمك أو رقمك. تقدر تمنع أو تمسح ملفات تعريف الارتباط من إعدادات المتصفح بتاعك، وتقدر تتحكم في الإعلانات المخصصة من{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-4">
                إعدادات إعلانات Google
              </a>.
            </p>
          </Section>

          <Section title="4. مشاركة البيانات">
            <p><strong>إحنا مش بنبيع بياناتك ولا بنأجرها لأي حد.</strong> ممكن تتشارك بس في الحالات دي:</p>
            <List>
              <li>مع فريق العيادة المسؤول عن الحجز والمتابعة.</li>
              <li>مع مزودي خدمات بنعتمد عليهم في التشغيل (زي منصات الإعلانات، وواتساب، وخدمات الاستضافة وإدارة العملاء)، وده في حدود اللي محتاجينه لتقديم الخدمة.</li>
              <li>لو القانون أو جهة رسمية مختصة طلبت كده.</li>
            </List>
          </Section>

          <Section title="5. حماية البيانات ومدة الاحتفاظ بيها">
            <p>
              بناخد إجراءات تقنية وإدارية مناسبة علشان نحمي بياناتك من الوصول أو الاستخدام غير المصرح بيه، والوصول ليها بيبقى للموظفين المختصين بس. بنحتفظ ببيانات التواصل طول ما هي لازمة للغرض اللي اتجمعت علشانه أو حسب ما يفرضه القانون، وبعد كده بتتمسح أو بتتحول لبيانات مجهولة.
            </p>
          </Section>

          <Section title="6. حقوقك">
            <p>طبقًا لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020، من حقك:</p>
            <List>
              <li>تعرف إيه البيانات اللي عندنا عنك وتطلب نسخة منها.</li>
              <li>تطلب تصحيح أو تحديث بياناتك.</li>
              <li>تطلب مسح بياناتك أو توقف استخدامها في التسويق.</li>
              <li>تسحب موافقتك في أي وقت.</li>
            </List>
            <p>علشان تستخدم أي حق من دول، تواصل معانا على البيانات اللي تحت، وهنرد عليك في أقرب وقت.</p>
          </Section>

          <Section title="7. خصوصية الأطفال">
            <p>خدماتنا عبر الموقع والإعلانات موجهة للبالغين. لو المريض أقل من 18 سنة، الحجز والتواصل بيتم من خلال ولي أمره.</p>
          </Section>

          <Section title="8. التعديلات على السياسة">
            <p>ممكن نحدّث السياسة دي من وقت للتاني، وأي تعديل هيتنشر في الصفحة دي مع تاريخ آخر تحديث.</p>
          </Section>

          <Section title="9. تواصل معانا">
            <p>لو عندك أي سؤال عن سياسة الخصوصية أو بياناتك:</p>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 md:p-6">
              <ul className="space-y-3">
                <li><strong>العيادة:</strong> عيادة ويف لطب الأسنان – Wave Dental Clinic</li>
                <li><strong>العنوان:</strong> {address}، مصر</li>
                <li>
                  <strong>التليفون:</strong>{" "}
                  <TrackedLink
                    href={`tel:${phone}`}
                    event="phone_click" eventParams={{ contact_method: "phone", cta_location: "privacy_policy", page_type: "privacy_policy" }}
                    className="text-blue-600 hover:text-blue-700" dir="ltr">
                    {phone}
                  </TrackedLink>
                </li>
                <li>
                  <strong>واتساب:</strong>{" "}
                  <TrackedLink
                    href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                    event="whatsapp_click" eventParams={{ contact_method: "whatsapp", cta_location: "privacy_policy", page_type: "privacy_policy" }}
                    className="text-blue-600 hover:text-blue-700" dir="ltr">
                    {whatsapp}
                  </TrackedLink>
                </li>
                <li>
                  <strong>البريد الإلكتروني:</strong>{" "}
                  <a href={`mailto:${clinicConfig.email}`} className="text-blue-600 hover:text-blue-700" dir="ltr">
                    {clinicConfig.email}
                  </a>
                </li>
              </ul>
            </div>
          </Section>

          <p className="mt-12 text-sm text-slate-500">
            <Link href="/" className="text-blue-600 hover:text-blue-700">← الرجوع للصفحة الرئيسية</Link>
          </p>
        </article>
      </main>
      <Footer settings={settings} pageType="privacy_policy" />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} pageType="privacy_policy" />
    </div>
  );
}
