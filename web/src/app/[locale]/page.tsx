'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'emr' | 'billing' | 'reports'>('schedule');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-200 selection:text-teal-900" style={{ direction: 'rtl' }}>
      
      {/* Soft Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 1 0-18v18z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 0 1 0 18V3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9h.01M12 12h.01M12 15h.01" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Clinic<span className="text-teal-600">Pro</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">المميزات</a>
            <a href="#demo" className="hover:text-teal-600 transition-colors">كيف يعمل</a>
            <a href="#why-us" className="hover:text-teal-600 transition-colors">لماذا نحن</a>
            <a href="#pricing" className="hover:text-teal-600 transition-colors">الأسعار</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/ar/login" className="text-sm font-semibold text-slate-600 hover:text-teal-600 px-4 py-2 rounded-lg transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/ar/login" className="text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(13,148,136,0.06)_0%,transparent_80%)] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Hero Left: Text & CTA */}
            <div className="lg:col-span-6 flex flex-col items-start text-right z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/20 bg-teal-50/60 text-teal-700 text-xs font-semibold mb-6 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                نظام ذكي متكامل لإدارة العيادات في مصر والوطن العربي
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
                نظام ذكي لإدارة العيادة<br />
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">من الحجز حتى الروشتة</span>
              </h1>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">
                احجز المواعيد بسهولة، واحفظ ملفات المرضى، واصدر الروشتات والفواتير، وتابع أداء عيادتك بالتقارير الذكية — في مكان واحد وبواجهة عربية سهلة الاستخدام ومريحة للعين.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12">
                <Link href="/ar/login" className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-teal-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  جرب النظام مجاناً الآن
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5 transform rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a href="#demo" className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-xl shadow-sm transition-all">
                  شاهد لوحة التحكم
                </a>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-8 border-t border-slate-200 pt-8 w-full">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">+500</div>
                  <div className="text-sm text-slate-500 mt-1">عيادة نشطة</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">99.9%</div>
                  <div className="text-sm text-slate-500 mt-1">وقت التشغيل</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">+100K</div>
                  <div className="text-sm text-slate-500 mt-1">روشتة إلكترونية</div>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Interactive Mockup */}
            <div className="lg:col-span-6 w-full relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-500 opacity-5 blur-3xl pointer-events-none" />
              
              {/* Device Frame */}
              <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-xl overflow-hidden">
                {/* Browser bar Mock */}
                <div className="flex gap-1.5 mb-4 items-center">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-slate-400 mr-3 font-medium select-none">clinicpro.online/dashboard</span>
                </div>

                {/* Dashboard Inner App Mockup */}
                <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden min-h-[360px] text-xs text-slate-600">
                  <div className="flex h-full min-h-[360px]">
                    {/* App Sidebar */}
                    <div className="w-36 border-l border-slate-100 bg-white p-2.5 flex flex-col gap-1.5">
                      <div className="h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center gap-2 px-2.5 font-bold mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        لوحة التحكم
                      </div>
                      <div className="h-7 rounded-lg text-slate-400 hover:bg-slate-50 flex items-center gap-2 px-2.5">📅 الحجوزات</div>
                      <div className="h-7 rounded-lg text-slate-400 hover:bg-slate-50 flex items-center gap-2 px-2.5">👤 المرضى</div>
                      <div className="h-7 rounded-lg text-slate-400 hover:bg-slate-50 flex items-center gap-2 px-2.5">💊 الروشتات</div>
                      <div className="h-7 rounded-lg text-slate-400 hover:bg-slate-50 flex items-center gap-2 px-2.5">💳 الفواتير</div>
                    </div>

                    {/* App Main Area */}
                    <div className="flex-1 p-4 flex flex-col gap-4">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="text-slate-400 font-medium">حجوزات اليوم</div>
                          <div className="text-base font-bold text-slate-900 mt-0.5">18 حالة</div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="text-slate-400 font-medium">الإيرادات</div>
                          <div className="text-base font-bold text-teal-600 mt-0.5">4,850 ج.م</div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="text-slate-400 font-medium">الانتظار</div>
                          <div className="text-base font-bold text-amber-600 mt-0.5">3 مرضى</div>
                        </div>
                      </div>

                      {/* Main Interactive Tab Preview */}
                      <div className="bg-white rounded-xl border border-slate-100 p-4 flex-1 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                          <span className="font-bold text-slate-800 text-xs">حالة الكشف الحالية</span>
                          <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold">نشط الآن</span>
                        </div>

                        {/* Interactive Queue Item */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50/40 border border-teal-100">
                          <div className="flex items-center gap-2.5">
                            <span className="h-7.5 w-7.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center font-bold text-white text-[10px]">أم</span>
                            <div>
                              <div className="font-bold text-slate-800">أحمد محمد علي</div>
                              <div className="text-[10px] text-slate-400">زيارة كشف • كود: P-1254</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-200/50 px-2.5 py-0.5 rounded">بالداخل</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 opacity-60">
                          <div className="flex items-center gap-2.5">
                            <span className="h-7.5 w-7.5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-[10px]">سح</span>
                            <div>
                              <div className="font-bold text-slate-600">سارة حسن عبد الله</div>
                              <div className="text-[10px] text-slate-400">زيارة استشارة • كود: P-1255</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200/50 px-2.5 py-0.5 rounded">انتظار</span>
                        </div>

                        {/* App Quick Action */}
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="flex-1 bg-teal-600 text-white font-bold py-2 rounded-lg text-center hover:bg-teal-700 transition-colors shadow-sm">
                            إضافة روشتة
                          </button>
                          <button type="button" className="px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200/60 transition-colors">
                            إنهاء
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-y border-slate-200 bg-white relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-teal-600">أدوات متكاملة ومترابطة</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">مميزات قوية لعيادة أكثر تنظيماً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 hover:border-teal-200 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">إدارة المواعيد</h3>
              <p className="text-slate-500 text-sm leading-relaxed">تقويم ذكي لتنظيم حجز المواعيد، تقليل فترات الانتظار، وتنبيهات تلقائية للمرتبة عبر الواتساب والرسائل.</p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 hover:border-teal-200 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ملفات المرضى</h3>
              <p className="text-slate-500 text-sm leading-relaxed">سجل طبي شامل لكل مريض يحتوي على التاريخ المرضي بالكامل، التشخيصات السابقة، الفحوصات والملفات المرفقة.</p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 hover:border-teal-200 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">الروشتات والفواتير</h3>
              <p className="text-slate-500 text-sm leading-relaxed">طباعة روشتات طبية احترافية، ومتابعة دقيقة لحسابات المرضى وإصدار إيصالات دفع مفصلة وسريعة.</p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 hover:border-teal-200 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">إحصائيات شاملة</h3>
              <p className="text-slate-500 text-sm leading-relaxed">لوحة تحكم تفاعلية تحلل بيانات الإيرادات، أعداد المرضى الأكثر زيارة، وتساعدك على تحسين وإدارة العيادة.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Tabs Showcasing section */}
      <section id="demo" className="py-24 relative overflow-hidden bg-slate-100/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Info Column */}
            <div className="lg:col-span-5 text-right">
              <h2 className="text-base font-semibold leading-7 text-teal-600">جولة داخل النظام</h2>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">تابع كل تفاصيل عيادتك من مكان واحد</h3>
              
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`p-4 rounded-xl text-right transition-all border ${activeTab === 'schedule' ? 'bg-white border-teal-500/20 text-slate-900 shadow-md shadow-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  <div className="font-bold text-base">🗓️ حجز المواعيد المتقدم</div>
                  <div className="text-xs text-slate-500 mt-1">تحديد فترات العمل، تنظيم الحجوزات ووضع المرضى في قائمة الانتظار الذكية.</div>
                </button>
                <button 
                  onClick={() => setActiveTab('emr')}
                  className={`p-4 rounded-xl text-right transition-all border ${activeTab === 'emr' ? 'bg-white border-teal-500/20 text-slate-900 shadow-md shadow-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  <div className="font-bold text-base">📂 الملف الطبي الإلكتروني</div>
                  <div className="text-xs text-slate-500 mt-1">حفظ التاريخ المرضي والأدوية وتتبع الحساسية والأمراض المزمنة لكل حالة.</div>
                </button>
                <button 
                  onClick={() => setActiveTab('billing')}
                  className={`p-4 rounded-xl text-right transition-all border ${activeTab === 'billing' ? 'bg-white border-teal-500/20 text-slate-900 shadow-md shadow-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  <div className="font-bold text-base">💳 الفوترة والحسابات السريعة</div>
                  <div className="text-xs text-slate-500 mt-1">تنظيم حسابات العيادة، طباعة إيصالات الدفع وتتبع الفواتير المتأخرة.</div>
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className={`p-4 rounded-xl text-right transition-all border ${activeTab === 'reports' ? 'bg-white border-teal-500/20 text-slate-900 shadow-md shadow-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  <div className="font-bold text-base">📊 التقارير والإيرادات اليومية</div>
                  <div className="text-xs text-slate-500 mt-1">رسوم بيانية توضح معدلات النمو، تدفقات النقدية ومقارنات فترات العمل المختلفة.</div>
                </button>
              </div>
            </div>

            {/* Showcase Visual Viewport */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 relative min-h-[420px] flex flex-col justify-between shadow-lg">
              
              {/* Dynamic rendering based on activeTab */}
              {activeTab === 'schedule' && (
                <div className="animate-fade-in-up flex flex-col h-full gap-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-900">جدول مواعيد اليوم • الأحد</span>
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded font-bold">5 حجوزات نشطة</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'محمد عبد الله إبراهيم', time: '06:00 م', type: 'كشف جديد' },
                      { name: 'أحمد محمود مصطفى', time: '06:30 م', type: 'استشارة' },
                      { name: 'سارة خالد محمود', time: '07:00 م', type: 'كشف جديد' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">{i+1}</span>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-400">{item.type}</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono bg-white px-3 py-1 rounded border border-slate-200">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'emr' && (
                <div className="animate-fade-in-up flex flex-col h-full gap-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-900">ملف المريض: د. أحمد كمال</span>
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded font-bold">التاريخ الطبي</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
                    <div>
                      <div className="text-xs text-slate-400">التشخيص الحالي</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">التهاب الشعب الهوائية الحاد</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">العلاج والوصفة الحالية</div>
                      <div className="text-sm font-bold text-teal-600 mt-1">Amoxicillin 500mg • كبسولة كل 8 ساعات</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">الحساسية والمحاذير</div>
                      <div className="text-xs text-red-600 font-semibold mt-1">⚠️ حساسية من البنسلين</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="animate-fade-in-up flex flex-col h-full gap-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-900">إصدار فاتورة مريض</span>
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded font-bold font-mono">INV-2026-08</span>
                  </div>
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>كشف عام (عيادة الباطنة)</span>
                      <span>300 ج.م</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>تحاليل وفحوصات داخلية</span>
                      <span>150 ج.م</span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-bold text-slate-950">
                      <span>الإجمالي</span>
                      <span className="text-teal-600">450 ج.م</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="animate-fade-in-up flex flex-col h-full gap-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-900">تحليل أداء الأسبوع</span>
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded font-bold">معدل الإيراد اليومي</span>
                  </div>
                  <div className="h-40 flex items-end justify-between gap-3 px-4 pt-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    {[60, 45, 90, 75, 120, 80, 110].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-teal-500 to-emerald-600 rounded-t" style={{ height: `${val}px` }} />
                        <span className="text-[9px] text-slate-400">يوم {i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-400">
                <span>تفاعلية كاملة</span>
                <Link href="/ar/login" className="text-teal-600 font-bold hover:underline">سجل الآن وشاهد بنفسك ←</Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Trust & Support Features */}
      <section id="why-us" className="py-24 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-teal-600">تطبيق آمن ومرن</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">لماذا عيادات الوطن العربي تختار ClinicPro؟</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 text-xl">🔒</div>
              <h4 className="text-base font-bold text-slate-900 mb-2">أمان كامل للبيانات</h4>
              <p className="text-sm text-slate-500 leading-relaxed">تشفير كامل وحفظ بيانات المرضى في خوادم سحابية آمنة ومحمية بالكامل.</p>
            </div>
            <div className="text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 text-xl">💬</div>
              <h4 className="text-base font-bold text-slate-900 mb-2">دعم فني وتدريب مجاني</h4>
              <p className="text-sm text-slate-500 leading-relaxed">فريقنا متواجد لمساعدتك في أي وقت لحل المشاكل وتدريب فريق عمل عيادتك.</p>
            </div>
            <div className="text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 text-xl">🇪🇬</div>
              <h4 className="text-base font-bold text-slate-900 mb-2">مناسب للعيادات والمراكز</h4>
              <p className="text-sm text-slate-500 leading-relaxed">يدعم الجداول، الأقسام المتعددة، وتخصيص التقارير بما يناسب نظام عملك.</p>
            </div>
            <div className="text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 text-xl">⚡</div>
              <h4 className="text-base font-bold text-slate-900 mb-2">سهل وبدون تنصيب</h4>
              <p className="text-sm text-slate-500 leading-relaxed">يعمل بالكامل من المتصفح وعلى أي جهاز (موبايل، تابلت، كمبيوتر) وبسرعة فائقة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 border-t border-slate-200 bg-slate-100/50 relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative rounded-3xl bg-white border border-slate-200 p-12 overflow-hidden text-center shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-50/40 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 sm:text-4xl">ابدأ إدارة عيادتك باحترافية اليوم</h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto mb-8">
              انضم إلى مئات الأطباء الذين قاموا بتنظيم المواعيد، وزيادة الرضا لدى المرضى، وزيادة أرباح عيادتهم باستخدام ClinicPro.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/ar/login" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
                ابدأ تجربتك المجانية الآن
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-sm text-slate-500">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900">Clinic<span className="text-teal-600">Pro</span></span>
            <span className="text-slate-300">|</span>
            <span>برنامج إدارة العيادات الطبية المتكامل</span>
          </div>

          <div className="flex gap-8">
            <Link href="/ar/login" className="hover:text-teal-600 transition-colors">تسجيل الدخول</Link>
            <a href="mailto:support@clinicpro.online" className="hover:text-teal-600 transition-colors">الدعم الفني</a>
            <a href="/sitemap.xml" className="hover:text-teal-600 transition-colors">خريطة الموقع</a>
          </div>

          <div className="text-slate-400">
            © {new Date().getFullYear()} ClinicPro. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

    </div>
  );
}
