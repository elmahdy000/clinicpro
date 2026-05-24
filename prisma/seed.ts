import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('\nSeeding multi-tenant SaaS database...\n');
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // 1. Create a Platform Owner (No Clinic)
  const platformOwner = await prisma.user.upsert({
    where: { email: 'owner@clinicpro.com' },
    update: {},
    create: {
      email: 'owner@clinicpro.com',
      password: hash('owner123'),
      name: 'Platform Owner',
      role: 'PLATFORM_OWNER'
    }
  });

  // 2. Create Clinic 1 (Dr. Mahdy's Clinic)
  const clinic1 = await prisma.clinic.create({
    data: {
      name: 'عيادة د. المهدي',
      address: 'القاهرة، مصر',
      phone: '01000000000',
      subscriptionPlan: 'PRO',
      settings: {
        create: {
          currency: 'EGP',
          timezone: 'Africa/Cairo'
        }
      }
    }
  });

  // 3. Create Users for Clinic 1
  const doctorUser = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      email: 'doctor@clinicpro.com',
      password: hash('doctor123'),
      name: 'د. المهدي',
      role: 'DOCTOR'
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      email: 'admin@clinicpro.com',
      password: hash('admin123'),
      name: 'Admin User',
      role: 'CLINIC_ADMIN'
    }
  });

  // 4. Create Doctor Profile
  const doctor = await prisma.doctor.create({
    data: {
      clinicId: clinic1.id,
      userId: doctorUser.id,
      specialization: 'General Physician',
      consultationFee: 500,
      status: 'active'
    }
  });

  // 5. Create Patients for Clinic 1
  const patient1 = await prisma.patient.create({
    data: {
      clinicId: clinic1.id,
      firstName: 'أحمد',
      lastName: 'علي',
      email: 'patient1@clinicpro.com',
      phone: '01234567890',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Male',
      bloodGroup: 'O+',
    }
  });

  // 6. Create Appointments, Medical Records, Prescriptions for Clinic 1
  const appointment1 = await prisma.appointment.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient1.id,
      doctorId: doctor.id,
      appointmentDate: new Date(),
      appointmentEndDate: new Date(Date.now() + 30 * 60000),
      durationMinutes: 30,
      type: 'Checkup',
      reason: 'Chest pain',
      status: 'COMPLETED'
    }
  });

  const record1 = await prisma.medicalRecord.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient1.id,
      doctorId: doctor.id,
      appointmentId: appointment1.id,
      chiefComplaint: 'Chest pain',
      diagnosis: 'Angina',
      treatmentPlan: 'Rest',
      vitalSigns: '{"bp":"120/80"}'
    }
  });

  await prisma.prescription.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient1.id,
      doctorId: doctor.id,
      medicalRecordId: record1.id,
      medications: '[{"name":"Aspirin","dosage":"81mg","frequency":"Once daily"}]',
      instructions: 'Take after meals'
    }
  });

  console.log('\n═══════════════════════════════════════');
  console.log('  SaaS SEED COMPLETED SUCCESSFULLY');
  console.log('═══════════════════════════════════════');
  console.log('  Login creds:');
  console.log('  Platform Owner: owner@clinicpro.com / owner123');
  console.log('  Clinic Admin:   admin@clinicpro.com / admin123');
  console.log('  Clinic Doctor:  doctor@clinicpro.com / doctor123');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
