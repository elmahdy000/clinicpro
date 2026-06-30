export enum UserRole {
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  SUB_ADMIN = 'SUB_ADMIN',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  ADMIN = 'CLINIC_ADMIN', // Backward compatibility: ADMIN resolves to 'CLINIC_ADMIN' string in DB
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT',
}

/** Roles that belong to a clinic (have clinicId) */
export const CLINIC_ROLES = [
  UserRole.CLINIC_ADMIN,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.RECEPTIONIST,
] as const;

/** Roles that can read clinical data */
export const CLINICAL_READ_ROLES = [
  UserRole.CLINIC_ADMIN,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.RECEPTIONIST,
] as const;
