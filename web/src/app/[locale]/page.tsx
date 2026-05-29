import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ClinicPro — برنامج إدارة العيادات الطبية المتكامل',
  description: 'ClinicPro أفضل برنامج إدارة العيادات والمراكز الطبية في مصر والوطن العربي. إدارة المواعيد، السجلات الطبية الإلكترونية، الفواتير، الصيدلية، وملفات المرضى بكل سهولة وأمان.',
  alternates: {
    canonical: 'https://clinicpro.online',
    languages: { ar: 'https://clinicpro.online/ar', en: 'https://clinicpro.online/en' },
  },
};

const features = [
  {
    title: 'إدارة المواعيد',
    desc: 'نظام ذكي لحجز وتنظيم مواعيد المرضى مع تذكيرات تلقائية وإدارة قائمة الانتظار في الوقت الفعلي.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  },
  {
    title: 'السجلات الطبية الإلكترونية',
    desc: 'ملفات طبية شاملة لكل مريض تشمل التاريخ المرضي، الفحوصات، التشخيصات، والوصفات الطبية.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    title: 'إدارة الصيدلية',
    desc: 'تتبع المخزون الدوائي، إصدار الوصفات الإلكترونية، وإدارة المستلزمات الطبية بدقة عالية.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M9 12h6m-3-3v6"/>
      </svg>
    ),
  },
  {
    title: 'الفواتير والحسابات',
    desc: 'إصدار فواتير احترافية، متابعة المدفوعات، وتقارير مالية تفصيلية لمتابعة إيرادات العيادة.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    title: 'تقارير وإحصاءات',
    desc: 'لوحة تحكم تفاعلية بتقارير مفصلة عن المرضى، الإيرادات، والأداء العام للعيادة.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    title: 'إدارة فريق العمل',
    desc: 'إدارة صلاحيات الأطباء والممرضين والموظفين مع جداول العمل وتوزيع المهام بكفاءة.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const trust = [
  { value: '+500', label: 'عيادة طبية' },
  { value: '99.9%', label: 'وقت التشغيل' },
  { value: '+50K', label: 'مريض مسجل' },
  { value: '24/7', label: 'دعم فني' },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080c14;
          --surface: #0e1420;
          --surface2: #141b28;
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(99,179,237,0.35);
          --text: #e2e8f0;
          --muted: #94a3b8;
          --accent: #38bdf8;
          --accent2: #818cf8;
          --teal: #2dd4bf;
          --glow: rgba(56,189,248,0.15);
        }
        body { background: var(--bg); color: var(--text); font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; direction: rtl; }
        .nav { position: sticky; top: 0; z-index: 100; background: rgba(8,12,20,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), var(--teal)); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-weight: 800; font-size: 20px; color: #fff; letter-spacing: -0.5px; }
        .logo-dot { color: var(--accent); }
        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .btn-ghost { color: var(--muted); text-decoration: none; padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; border: 1px solid var(--border); transition: all 0.2s; }
        .btn-ghost:hover { color: var(--text); border-color: var(--border-hover); }
        .btn-primary { color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; background: linear-gradient(135deg, var(--accent), var(--accent2)); transition: all 0.2s; box-shadow: 0 0 20px rgba(56,189,248,0.25); }
        .btn-primary:hover { opacity: 0.9; box-shadow: 0 0 30px rgba(56,189,248,0.4); transform: translateY(-1px); }

        .hero { min-height: 92vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 80px 32px; position: relative; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(56,189,248,0.12) 0%, transparent 70%); pointer-events: none; }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 60% 70% at 50% 50%, black 30%, transparent 100%); pointer-events: none; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.25); border-radius: 50px; padding: 6px 16px; color: var(--accent); font-size: 13px; font-weight: 500; margin-bottom: 28px; }
        .badge-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .hero h1 { font-size: clamp(32px, 5.5vw, 64px); font-weight: 800; line-height: 1.15; color: #fff; letter-spacing: -1px; margin-bottom: 20px; }
        .hero h1 .grad { background: linear-gradient(135deg, var(--accent) 0%, var(--teal) 50%, var(--accent2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero p { font-size: 17px; color: var(--muted); line-height: 1.75; max-width: 560px; margin: 0 auto 40px; }
        .hero-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 64px; }
        .btn-hero { text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; transition: all 0.25s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-hero-main { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; box-shadow: 0 0 40px rgba(56,189,248,0.3); }
        .btn-hero-main:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(56,189,248,0.45); }
        .btn-hero-sec { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
        .btn-hero-sec:hover { border-color: var(--border-hover); background: var(--surface2); }

        .stats { display: flex; gap: 48px; justify-content: center; flex-wrap: wrap; }
        .stat { text-align: center; }
        .stat-val { font-size: 30px; font-weight: 800; color: var(--accent); letter-spacing: -1px; }
        .stat-label { font-size: 13px; color: var(--muted); margin-top: 2px; }

        .section { padding: 96px 32px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .section-head { text-align: center; margin-bottom: 60px; }
        .section-tag { font-size: 12px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
        .section-head h2 { font-size: clamp(26px, 4vw, 42px); font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 12px; }
        .section-head p { font-size: 16px; color: var(--muted); max-width: 480px; margin: 0 auto; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2px; background: var(--border); border-radius: 20px; overflow: hidden; border: 1px solid var(--border); }
        .feature-card { background: var(--surface); padding: 32px; transition: background 0.2s; }
        .feature-card:hover { background: var(--surface2); }
        .feature-icon { width: 52px; height: 52px; background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.1)); border: 1px solid rgba(56,189,248,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--accent); margin-bottom: 20px; }
        .feature-card h3 { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .feature-card p { font-size: 14px; color: var(--muted); line-height: 1.75; }

        .why-section { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; }
        .why-card { text-align: center; }
        .why-icon { width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(45,212,191,0.1)); border: 1px solid rgba(56,189,248,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--teal); }
        .why-card h3 { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .why-card p { font-size: 13px; color: var(--muted); line-height: 1.6; }

        .cta-section { text-align: center; }
        .cta-box { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 72px 40px; position: relative; overflow: hidden; }
        .cta-box::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% -10%, rgba(56,189,248,0.1), transparent 70%); pointer-events: none; }
        .cta-box h2 { font-size: clamp(24px, 4vw, 42px); font-weight: 800; color: #fff; margin-bottom: 16px; letter-spacing: -0.5px; }
        .cta-box p { color: var(--muted); font-size: 16px; margin-bottom: 36px; }

        footer { background: var(--surface); border-top: 1px solid var(--border); padding: 40px 32px; text-align: center; color: var(--muted); font-size: 13px; }
        .footer-inner { max-width: 900px; margin: 0 auto; }
        .footer-logo { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 16px; }
        .footer-links { display: flex; gap: 24px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
        .footer-links a { color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--accent); }
        .footer-copy { color: #475569; }

        @media (max-width: 640px) {
          .nav-inner { padding: 14px 20px; }
          .hero { padding: 60px 20px; }
          .section { padding: 64px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats { gap: 28px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" width="20" height="20">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span className="logo-text">Clinic<span className="logo-dot">Pro</span></span>
          </div>
          <div className="nav-actions">
            <Link href="/ar/login" className="btn-ghost">تسجيل الدخول</Link>
            <Link href="/ar/login" className="btn-primary">ابدأ مجاناً</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="badge">
          <span className="badge-dot" />
          الحل الرقمي الأمثل للعيادات الطبية
        </div>
        <h1>
          أدر عيادتك بـ<span className="grad">ذكاء</span><br />وبكل احترافية
        </h1>
        <p>
          منصة ClinicPro المتكاملة تجمع إدارة المواعيد، السجلات الطبية، الفواتير، والصيدلية في نظام واحد سهل الاستخدام مصمم للبيئة الطبية العربية.
        </p>
        <div className="hero-actions">
          <Link href="/ar/login" className="btn-hero btn-hero-main">
            ابدأ التجربة المجانية
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{transform:'rotate(180deg)'}}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <a href="#features" className="btn-hero btn-hero-sec">اكتشف المزايا</a>
        </div>
        <div className="stats">
          {trust.map(({ value, label }) => (
            <div className="stat" key={label}>
              <div className="stat-val">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-tag">المزايا</div>
            <h2>كل ما تحتاجه لإدارة عيادتك</h2>
            <p>أدوات متكاملة مصممة خصيصاً لتلبية احتياجات الطبيب والعيادة العربية</p>
          </div>
          <div className="features-grid">
            {features.map(({ title, desc, svg }) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon">{svg}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="section why-section">
        <div className="container">
          <div className="section-head">
            <div className="section-tag">لماذا ClinicPro</div>
            <h2>مبني على الثقة والأمان</h2>
            <p>مئات العيادات والمراكز الطبية تثق بنا يومياً لإدارة عملياتها</p>
          </div>
          <div className="why-grid">
            {[
              { title: 'أمان البيانات', desc: 'تشفير SSL كامل وحماية بيانات المرضى وفق أعلى المعايير الدولية.', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="26" height="26"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { title: 'سحابي بالكامل', desc: 'وصول فوري من أي جهاز وأي مكان دون الحاجة لتثبيت أي برامج.', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="26" height="26"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> },
              { title: 'عربي بالكامل', desc: 'واجهة عربية كاملة تدعم RTL ومصممة للطبيب والمريض العربي.', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="26" height="26"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
              { title: 'سريع وموثوق', desc: 'أداء عالي وتوافر 99.9% لضمان استمرارية عملك بلا انقطاع.', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="26" height="26"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            ].map(({ title, desc, svg }) => (
              <div className="why-card" key={title}>
                <div className="why-icon">{svg}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>جاهز لتطوير عيادتك؟</h2>
            <p>انضم إلى مئات العيادات التي تستخدم ClinicPro الآن وابدأ رحلة الإدارة الذكية</p>
            <Link href="/ar/login" className="btn-hero btn-hero-main">
              ابدأ مجاناً الآن — بدون بطاقة ائتمانية
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-logo">ClinicPro</div>
          <div className="footer-links">
            <Link href="/ar/login">تسجيل الدخول</Link>
            <a href="mailto:support@clinicpro.online">تواصل معنا</a>
            <a href="https://clinicpro.online/sitemap.xml">خريطة الموقع</a>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} ClinicPro — جميع الحقوق محفوظة</div>
        </div>
      </footer>
    </>
  );
}
