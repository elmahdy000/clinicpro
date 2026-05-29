import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ClinicPro — برنامج إدارة العيادات الطبية المتكامل',
  description: 'ClinicPro أفضل برنامج إدارة العيادات والمراكز الطبية في مصر والوطن العربي. إدارة المواعيد، السجلات الطبية الإلكترونية، الفواتير، الصيدلية، وملفات المرضى بكل سهولة وأمان.',
  alternates: {
    canonical: 'https://clinicpro.online',
    languages: {
      ar: 'https://clinicpro.online/ar',
      en: 'https://clinicpro.online/en',
    },
  },
};

export default function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', direction: 'rtl', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b' }}>

      {/* ===== NAV ===== */}
      <nav style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(13,148,136,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏥</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>ClinicPro</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/ar/login" style={{ color: '#fff', textDecoration: 'none', padding: '8px 20px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 8, fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}>تسجيل الدخول</Link>
          <Link href="/ar/login" style={{ color: '#0d9488', textDecoration: 'none', padding: '8px 20px', background: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>ابدأ مجاناً</Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(160deg, #0d9488 0%, #0891b2 50%, #0f766e 100%)', padding: '80px 32px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 50, padding: '6px 20px', marginBottom: 24, color: '#fff', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.25)' }}>
            🚀 الحل الأمثل لإدارة عيادتك
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 20px', textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            برنامج إدارة العيادات الطبية<br />
            <span style={{ color: '#a7f3d0' }}>المتكامل والذكي</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
            نظام ClinicPro يساعد الأطباء والعيادات على إدارة المواعيد، السجلات الطبية الإلكترونية، الفواتير وملفات المرضى من مكان واحد بكفاءة عالية
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/ar/login" style={{ background: '#fff', color: '#0d9488', padding: '14px 36px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', display: 'inline-block' }}>
              ابدأ التجربة المجانية →
            </Link>
            <a href="#features" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 36px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-block' }}>
              اعرف أكثر
            </a>
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['+500', 'عيادة طبية'], ['99.9%', 'وقت التشغيل'], ['24/7', 'دعم فني']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#a7f3d0', fontSize: 28, fontWeight: 800 }}>{num}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{ padding: '80px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>كل ما تحتاجه لإدارة عيادتك</h2>
          <p style={{ color: '#64748b', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>أدوات متكاملة مصممة خصيصاً للبيئة الطبية العربية</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { icon: '📅', title: 'إدارة المواعيد', desc: 'نظام ذكي لحجز وتنظيم مواعيد المرضى مع تذكيرات تلقائية وإدارة قائمة الانتظار في الوقت الفعلي' },
            { icon: '🗂️', title: 'السجلات الطبية الإلكترونية', desc: 'ملفات طبية شاملة لكل مريض تشمل التاريخ المرضي، الفحوصات، التشخيصات، والوصفات الطبية' },
            { icon: '💊', title: 'إدارة الصيدلية', desc: 'تتبع المخزون الدوائي، إصدار الوصفات الإلكترونية، وإدارة المستلزمات الطبية بدقة عالية' },
            { icon: '💰', title: 'الفواتير والحسابات', desc: 'إصدار فواتير احترافية، متابعة المدفوعات، وتقارير مالية تفصيلية لمتابعة إيرادات العيادة' },
            { icon: '📊', title: 'تقارير وإحصاءات', desc: 'لوحة تحكم تفاعلية بتقارير مفصلة عن المرضى، الإيرادات، والأداء العام للعيادة' },
            { icon: '👥', title: 'إدارة فريق العمل', desc: 'إدارة صلاحيات الأطباء والممرضين والموظفين مع جداول العمل وتوزيع المهام بكفاءة' },
          ].map(({ icon, title, desc }) => (
            <article key={title} style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===== WHY CLINICPRO ===== */}
      <section style={{ background: '#f0fdf4', padding: '72px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>لماذا ClinicPro؟</h2>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 48 }}>مئات العيادات والمراكز الطبية تثق بنا يومياً</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', label: 'أمان البيانات', desc: 'تشفير SSL كامل وحماية بيانات المرضى وفق أعلى المعايير' },
              { icon: '☁️', label: 'سحابي بالكامل', desc: 'وصول من أي جهاز وأي مكان دون الحاجة لتثبيت برامج' },
              { icon: '🇸🇦', label: 'عربي بالكامل', desc: 'واجهة عربية كاملة تدعم RTL ومصممة للطبيب العربي' },
              { icon: '⚡', label: 'سريع وموثوق', desc: 'أداء عالي وتوافر 99.9% لضمان استمرارية عملك' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{label}</div>
                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', padding: '72px 32px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>جاهز لتطوير عيادتك؟</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 32 }}>انضم إلى مئات العيادات التي تستخدم ClinicPro الآن</p>
        <Link href="/ar/login" style={{ background: '#fff', color: '#0d9488', padding: '16px 48px', borderRadius: 12, fontWeight: 700, fontSize: 17, textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', display: 'inline-block' }}>
          ابدأ مجاناً الآن
        </Link>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>ClinicPro</span>
          <span style={{ margin: '0 12px', color: '#475569' }}>|</span>
          <span>نظام إدارة العيادات الطبية المتكامل</span>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
          <Link href="/ar/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>تسجيل الدخول</Link>
          <a href="mailto:support@clinicpro.online" style={{ color: '#94a3b8', textDecoration: 'none' }}>تواصل معنا</a>
        </div>
        <div style={{ fontSize: 12, color: '#475569' }}>© {new Date().getFullYear()} ClinicPro — جميع الحقوق محفوظة</div>
      </footer>
    </div>
  );
}
