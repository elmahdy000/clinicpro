import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date, locale = 'en'): string {
  const d = new Date(date);
  return d.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  // Auth / Permissions
  'unauthorized': 'غير مصرح بالدخول، انتهت صلاحية الجلسة أو يرجى تسجيل الدخول أولاً',
  'forbidden resource': 'عذراً، لا تمتلك الصلاحية الكافية للقيام بهذا الإجراء',
  'forbidden': 'عذراً، هذا الإجراء غير مسموح به لحسابك الحالي',
  
  // Appointments & Scheduling
  'time slot overlaps with appointment': 'يتعارض هذا الوقت مع موعد آخر محجوز بالفعل لدى الطبيب',
  'cannot reschedule a cancelled appointment': 'لا يمكن إعادة جدولة موعد ملغى',
  'cannot reschedule a completed appointment': 'لا يمكن إعادة جدولة موعد مكتمل بالفعل',
  'cannot reschedule a missed appointment': 'لا يمكن إعادة جدولة موعد لم يحضر فيه المريض',
  'appointment not found': 'الموعد المطلوب غير موجود',

  // Validation / DTO Fields
  'type must be a string': 'يرجى اختيار نوع الموعد بشكل صحيح',
  'type should not be empty': 'نوع الموعد مطلوب ولا يمكن تركه فارغاً',
  'durationminutes must be a number': 'يجب تحديد مدة الموعد كعدد صحيح بالدقائق',
  'patientid must be a number': 'يرجى اختيار مريض صالح من القائمة',
  'doctorid must be a number': 'يرجى اختيار طبيب صالح من القائمة',
  'appointmentdate must be a date string': 'يرجى تحديد تاريخ ووقت الموعد بشكل صحيح',
  'reason must be a string': 'حقل سبب الزيارة يجب أن يكون نصاً صالحاً',

  // Database / Resources
  'patient not found': 'المريض المطلوب غير موجود في سجلات العيادة',
  'doctor not found': 'الطبيب المطلوب غير موجود في سجلات العيادة',
  'clinic not found': 'العيادة المطلوبة غير مسجلة في النظام',
  'user not found': 'المستخدم المطلوب غير موجود',
  'clinic context is missing': 'سياق العيادة غير محدد، يرجى تسجيل الدخول مجدداً لنطاق عيادة صالح',
  'not found': 'العنصر المطلوب غير موجود بقاعدة البيانات',

  // General Network / Axios
  'network error': 'خطأ في الاتصال بالشبكة، يرجى التحقق من اتصال الإنترنت',
  'internal server error': 'حدث خطأ داخلي في النظام، يرجى المحاولة لاحقاً',
  'request failed with status code 400': 'البيانات المرسلة غير صالحة، يرجى مراجعة الحقول وإعادة المحاولة',
  'request failed with status code 403': 'عذراً، لا تمتلك الصلاحية الكافية للقيام بهذا الإجراء (خطأ 403)',
  'request failed with status code 404': 'العنصر أو المسار المطلوب غير موجود (خطأ 404)',
  'request failed with status code 500': 'حدث خطأ داخلي في الخادم (خطأ 500)، يرجى مراجعة الدعم الفني',
};

function translateErrorToArabic(msg: string): string {
  if (!msg) return msg;
  const lowerMsg = msg.toLowerCase();
  
  for (const [english, arabic] of Object.entries(ERROR_TRANSLATIONS)) {
    if (lowerMsg.includes(english)) {
      return arabic;
    }
  }

  // Handle dynamic substring patterns
  if (lowerMsg.includes('overlaps with appointment')) {
    return 'يتعارض هذا الوقت مع موعد آخر محجوز بالفعل لدى الطبيب';
  }

  return msg;
}

export function extractErrorMessage(err: any, fallback: string = 'حدث خطأ غير متوقع'): string {
  let message = fallback;
  
  if (err) {
    if (err.response?.data) {
      const data = err.response.data;
      if (data.message) {
        if (Array.isArray(data.message)) {
          message = data.message[0];
        } else if (typeof data.message === 'string') {
          message = data.message;
        }
      } else if (data.error && typeof data.error === 'string') {
        message = data.error;
      }
    } else if (err instanceof Error && err.message) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }
  }
  
  return translateErrorToArabic(message);
}
