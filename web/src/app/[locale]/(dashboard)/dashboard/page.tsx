'use client';

import { useAuth } from '@/stores/auth';
import ClinicDashboard from '@/components/dashboard/ClinicDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'PLATFORM_OWNER') {
    return <AdminDashboard />;
  }

  if (user?.role === 'DOCTOR') {
    return <DoctorDashboard />;
  }

  return <ClinicDashboard />;
}
