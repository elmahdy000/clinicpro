'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, UserPlus, UserCog, Edit, Trash2, KeyRound, Mail,
  ShieldCheck, Loader2, X, Search, UserCheck, Stethoscope, ClipboardList, ShieldAlert
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function StaffManagementPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('NURSE');
  const [specialization, setSpecialization] = useState('General Medicine');

  // Load staff list (Automatically tenant-isolated by backend Prisma middleware!)
  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await api.get('/users?limit=100');
      return data;
    },
  });

  const staffList = data?.data || [];

  // Reset form states
  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('NURSE');
    setSpecialization('General Medicine');
    setEditingUser(null);
  };

  // Open modal for adding a new staff member
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing a staff member
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Leave password blank unless they want to change it
    setRole(user.role);
    setSpecialization(user.specialization || 'General Medicine');
    setIsModalOpen(true);
  };

  // Submit Handler for Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error(isRtl ? 'الرجاء ملء جميع الحقول المطلوبة.' : 'Please fill out all required fields.');
      return;
    }

    if (!editingUser && password.length < 6) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }

    if (editingUser && password && password.length < 6) {
      toast.error(isRtl ? 'كلمة المرور الجديدة يجب أن تكون ٦ أحرف على الأقل.' : 'New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Edit User
        const payload: any = { name, email, role };
        if (password) {
          payload.password = password; // Only update password if provided
        }
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success(isRtl ? `تم تحديث بيانات "${name}" بنجاح!` : `Staff details for "${name}" updated!`);
      } else {
        // Add New User
        await api.post('/users', { name, email, password, role, specialization: role === 'DOCTOR' ? specialization : undefined });
        toast.success(isRtl ? `تم إضافة "${name}" كعضو جديد في الطاقم الطبي!` : `New staff member "${name}" added successfully!`);
      }

      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || '';
      if (errMsg.includes('Email already')) {
        toast.error(isRtl ? 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر.' : 'Email is already in use by another user.');
      } else {
        toast.error(isRtl ? 'حدث خطأ غير متوقع أثناء حفظ البيانات.' : 'An error occurred while saving.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User Handler
  const handleDelete = async (id: number, userName: string) => {
    const confirmMsg = isRtl
      ? `هل أنت متأكد تماماً من إلغاء وتجميد حساب "${userName}" وإزالته من طاقم العيادة الطبي؟`
      : `Are you sure you want to permanently remove "${userName}" from the medical staff?`;

    if (confirm(confirmMsg)) {
      try {
        await api.delete(`/users/${id}`);
        toast.success(isRtl ? 'تم إزالة عضو الطاقم الطبي بنجاح!' : 'Staff member removed successfully!');
        queryClient.invalidateQueries({ queryKey: ['staff'] });
      } catch (error) {
        toast.error(isRtl ? 'فشل إزالة عضو الطاقم. الرجاء المحاولة مرة أخرى.' : 'Failed to delete staff member.');
      }
    }
  };

  // Helper to render role label with badges
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'CLINIC_ADMIN':
        return (
          <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {isRtl ? 'مدير عيادة (Admin)' : 'Clinic Admin'}
          </Badge>
        );
      case 'DOCTOR':
        return (
          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50 text-xs font-bold gap-1">
            <Stethoscope className="w-3.5 h-3.5" />
            {isRtl ? 'طبيب متخصص' : 'Doctor'}
          </Badge>
        );
      case 'NURSE':
        return (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 text-xs font-bold gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {isRtl ? 'ممرض / ممرضة' : 'Nurse'}
          </Badge>
        );
      case 'RECEPTIONIST':
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-xs font-bold gap-1">
            <ClipboardList className="w-3.5 h-3.5" />
            {isRtl ? 'موظف استقبال' : 'Receptionist'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Filters staff by search and role
  const filteredStaff = staffList.filter((user: any) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const totalStaff = staffList.length;
  const doctorsCount = staffList.filter((u: any) => u.role === 'DOCTOR').length;
  const nursesCount = staffList.filter((u: any) => u.role === 'NURSE').length;
  const receptionistsCount = staffList.filter((u: any) => u.role === 'RECEPTIONIST').length;

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-start">
            <UserCog className="w-6 h-6 text-teal-600 animate-pulse" />
            {isRtl ? 'إدارة الطاقم الطبي وصلاحيات العيادة' : 'Clinic Staff & Permissions Control'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'قم بإضافة الممرضين، أطباء العيادة، وموظفي الاستقبال، تعيين صلاحياتهم، وتغيير كلمات مرورهم بالكامل.' : 'Add medical staff, manage access levels, modify profiles, and change passwords.'}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={openAddModal}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 font-bold h-10 px-4 rounded-xl shadow-md transition-all text-xs"
          >
            <UserPlus className="w-4 h-4" />
            {isRtl ? 'إضافة موظف جديد' : 'Add Staff Member'}
          </Button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي الكادر الطبي' : 'Total Medical Staff', value: totalStaff, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/50' },
          { label: isRtl ? 'الأطباء الأخصائيين' : 'Specialist Doctors', value: doctorsCount, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50' },
          { label: isRtl ? 'طاقم التمريض' : 'Nursing Staff', value: nursesCount, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50' },
          { label: isRtl ? 'موظفي الاستقبال' : 'Receptionists', value: receptionistsCount, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50' }
        ].map((stat, i) => (
          <Card key={i} className={`border ${stat.color} shadow-sm`}>
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-black font-mono block">{stat.value}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1 block">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder={isRtl ? 'البحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pr-9 text-xs font-semibold text-right"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">{isRtl ? 'تصفية الصلاحية:' : 'Role Filter:'}</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
            >
              <option value="">{isRtl ? 'كل الصلاحيات' : 'All Roles'}</option>
              <option value="CLINIC_ADMIN">{isRtl ? 'مدير عيادة (Admin)' : 'Clinic Admin'}</option>
              <option value="DOCTOR">{isRtl ? 'طبيب متخصص (Doctor)' : 'Doctor'}</option>
              <option value="NURSE">{isRtl ? 'ممرض / ممرضة (Nurse)' : 'Nurse'}</option>
              <option value="RECEPTIONIST">{isRtl ? 'موظف استقبال (Receptionist)' : 'Receptionist'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── STAFF DATA LISTING ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredStaff.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold text-sm">
            {isRtl ? 'لم يتم العثور على موظفين مطابقين للبحث.' : 'No staff members match the criteria.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredStaff.map((user: any) => (
            <Card key={user.id} className="hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-200 flex flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{user.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {renderRoleBadge(user.role)}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-4 gap-2">
                <div className="text-[10px] text-gray-400">
                  {isRtl ? 'تاريخ الإضافة:' : 'Added on:'} {new Date(user.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                </div>

                <div className="flex gap-2">
                  {/* Edit details */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(user)}
                    className="h-8 text-xs gap-1 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {isRtl ? 'تعديل وكلمة المرور' : 'Edit & Password'}
                  </Button>

                  {/* Delete / Suspend staff member */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(user.id, user.name)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── HIGH FIDELITY EDIT/ADD DIALOG MODAL (Arabic / English supported) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all transform scale-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {editingUser 
                    ? (isRtl ? `تعديل صلاحيات وحساب: ${editingUser.name}` : `Modify Staff Profile: ${editingUser.name}`)
                    : (isRtl ? 'إضافة عضو جديد للطاقم الطبي' : 'Register New Medical Staff')}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4 text-right">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                    {isRtl ? 'الاسم بالكامل للظهور في السيستم *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isRtl ? 'مثال: د. ماجدة إبراهيم' : 'e.g. Dr. Magda Ibrahim'}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white text-right"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                    {isRtl ? 'البريد الإلكتروني لتسجيل الدخول *' : 'Login Email *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@clinicpro.com"
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white font-mono text-left"
                  />
                </div>

                {/* Password / Change Password Field */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>
                      {editingUser 
                        ? (isRtl ? 'تغيير كلمة المرور (اختياري)' : 'Change Password (Optional)')
                        : (isRtl ? 'كلمة المرور الافتراضية *' : 'Default Password *')}
                    </span>
                    <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser 
                      ? (isRtl ? 'اتركها فارغة للاحتفاظ بكلمة المرور الحالية' : 'Leave empty to keep current')
                      : '••••••••'}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white font-mono text-left"
                  />
                  {editingUser && (
                    <p className="text-[10px] text-teal-600 font-bold mt-1">
                      {isRtl 
                        ? '💡 يتيح لك الطبيب/الأدمن تغيير كلمة مرور أي موظف فوراً في حال نسيانها!' 
                        : '💡 Allows immediate password reset if a staff member forgets it!'}
                    </p>
                  )}
                </div>

                {/* Role / Permission Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                    {isRtl ? 'الصلاحية والوظيفة بالعيادة *' : 'Clinic Role & Access Level *'}
                  </label>
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  >
                    <option value="NURSE">{isRtl ? 'ممرض / ممرضة (Nurse)' : 'Nurse'}</option>
                    <option value="RECEPTIONIST">{isRtl ? 'موظف استقبال (Receptionist)' : 'Receptionist'}</option>
                    <option value="DOCTOR">{isRtl ? 'طبيب متخصص (Doctor)' : 'Doctor'}</option>
                    <option value="CLINIC_ADMIN">{isRtl ? 'مدير عيادة (Clinic Admin)' : 'Clinic Admin'}</option>
                  </select>
                </div>

                {/* Specialization - only shown when role is DOCTOR */}
                {role === 'DOCTOR' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                      {isRtl ? 'التخصص الطبي *' : 'Specialization *'}
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                    >
                      <option value="General Medicine">{isRtl ? 'طب عام وباطني' : 'General Medicine'}</option>
                      <option value="Pediatrics">{isRtl ? 'طب الأطفال وحديثي الولادة' : 'Pediatrics'}</option>
                      <option value="Cardiology">{isRtl ? 'أمراض القلب والأوعية الدموية' : 'Cardiology'}</option>
                      <option value="Dentistry">{isRtl ? 'طب وجراحة الفم والأسنان' : 'Dentistry'}</option>
                      <option value="Orthopedics">{isRtl ? 'جراحة العظام والمفاصل' : 'Orthopedics'}</option>
                      <option value="Ophthalmology">{isRtl ? 'طب وجراحة العيون' : 'Ophthalmology'}</option>
                      <option value="Gynecology & Obstetrics">{isRtl ? 'طب النساء والتوليد' : 'Gynecology & Obstetrics'}</option>
                      <option value="Dermatology & Venereology">{isRtl ? 'الأمراض الجلدية والتناسلية' : 'Dermatology & Venereology'}</option>
                      <option value="ENT">{isRtl ? 'طب وجراحة الأنف والأذن والحنجرة' : 'ENT'}</option>
                      <option value="Gastroenterology">{isRtl ? 'أمراض الجهاز الهضمي والكبد' : 'Gastroenterology'}</option>
                      <option value="Urology">{isRtl ? 'طب وجراحة المسالك البولية' : 'Urology'}</option>
                      <option value="General Surgery">{isRtl ? 'الجراحة العامة' : 'General Surgery'}</option>
                      <option value="Endocrinology & Diabetes">{isRtl ? 'الغدد الصماء والسكري' : 'Endocrinology & Diabetes'}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-900 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 text-xs"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs gap-1"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isRtl ? 'حفظ الصلاحيات والموظف' : 'Save Staff Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
