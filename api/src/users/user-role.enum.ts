export enum UserRole {
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  SUB_ADMIN = 'SUB_ADMIN',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  ADMIN = 'CLINIC_ADMIN', // Backward compatibility for existing controller guards
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT',
}
