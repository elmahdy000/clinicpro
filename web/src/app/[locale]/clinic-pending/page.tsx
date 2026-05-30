'use client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ClinicPendingApprovalPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'ar';

  // Read data from sessionStorage (set during failed login)
  let clinicName = '';
  let isRejected = false;
  let rejectionNote = '';
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('clinicApprovalError');
      if (raw) {
        const parsed = JSON.parse(raw);
        clinicName = parsed.clinicName || '';
        isRejected = parsed.code === 'CLINIC_REJECTED';
        rejectionNote = parsed.approvalNote || '';
      }
    } catch {}
  }

  const handleBack = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('clinicApprovalError');
    router.push(`/${locale}/login`);
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        padding: '24px',
      }}
    >
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 250, height: 250, borderRadius: '50%', background: isRejected ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)', filter: 'blur(60px)' }} />
      </div>

      <div
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isRejected ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 24,
          padding: '48px 40px',
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: isRejected
              ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))'
              : 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 44,
            border: `2px solid ${isRejected ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}`,
          }}
        >
          {isRejected ? '❌' : '⏳'}
        </div>

        {/* Title */}
        <h1
          style={{
            color: '#fff',
            fontSize: 26,
            fontWeight: 700,
            margin: '0 0 12px',
            lineHeight: 1.4,
          }}
        >
          {isRejected ? 'تم رفض طلب التسجيل' : 'طلبك قيد المراجعة'}
        </h1>

        {/* Clinic name badge */}
        {clinicName && (
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 50,
              padding: '6px 20px',
              color: '#94a3b8',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            🏥 {clinicName}
          </div>
        )}

        {/* Description */}
        <p
          style={{
            color: '#94a3b8',
            fontSize: 16,
            lineHeight: 1.8,
            margin: '0 0 32px',
          }}
        >
          {isRejected
            ? 'نأسف لإبلاغك بأنه تم رفض طلب تسجيل عيادتك.'
            : 'شكراً لتسجيلك في ClinicPro. سيقوم فريقنا بمراجعة طلبك وإشعارك بالموافقة خلال 24-48 ساعة عبر البريد الإلكتروني.'}
        </p>

        {/* Rejection note */}
        {isRejected && rejectionNote && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 28,
              textAlign: 'right',
            }}
          >
            <p style={{ color: '#fca5a5', fontSize: 14, margin: 0, fontWeight: 600 }}>سبب الرفض:</p>
            <p style={{ color: '#f87171', fontSize: 14, margin: '6px 0 0', lineHeight: 1.6 }}>{rejectionNote}</p>
          </div>
        )}

        {/* Steps — only show for pending */}
        {!isRejected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'right' }}>
            {[
              { icon: '✅', text: 'استلام طلب التسجيل', done: true },
              { icon: '🔍', text: 'مراجعة البيانات من الفريق', done: false },
              { icon: '📧', text: 'إرسال إشعار الموافقة', done: false },
              { icon: '🚀', text: 'تفعيل الحساب والبدء في الاستخدام', done: false },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: step.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${step.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{step.done ? '✅' : step.icon}</span>
                <span style={{ color: step.done ? '#86efac' : '#64748b', fontSize: 14, flex: 1 }}>{step.text}</span>
                {step.done && (
                  <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>تم</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact box for rejected */}
        {isRejected && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 28,
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              للاستفسار، تواصل معنا على
            </p>
            <a
              href="mailto:support@clinicpro.online"
              style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              support@clinicpro.online
            </a>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            background: isRejected
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            border: 'none',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.3px',
          }}
        >
          {isRejected ? 'العودة إلى تسجيل الدخول' : 'فهمت، سأنتظر'}
        </button>
      </div>
    </div>
  );
}
