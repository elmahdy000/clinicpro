import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedEgyptLocations } from './egypt-locations';

const prisma = new PrismaClient();

async function main() {
  console.log('\n======================================================');
  console.log('       STARTING CLINICPRO MULTI-SCENARIO SEEDER       ');
  console.log('======================================================\n');
  
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // 1. Seed Egypt Locations (Cairo, Giza, Alexandria, etc.)
  await seedEgyptLocations(prisma);

  // Clean all dynamic tables to prevent unique constraint conflicts on repeat runs
  console.log('🧹 Cleaning old database records...');
  const p = prisma as any;
  await p.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await p.appointmentStatusChange.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await p.stockMovement.deleteMany();
  await p.medicationStock.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.clinicPatient.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinicSettings.deleteMany();
  await prisma.clinic.deleteMany();
  console.log('✨ Cleanup completed successfully.');

  // 2. Create Platform Owner (Global Administrator)
  console.log('👤 Creating Platform Owner...');
  await prisma.user.create({
    data: {
      email: 'owner@clinicpro.com',
      password: hash('owner123'),
      name: 'Platform Owner',
      role: 'PLATFORM_OWNER'
    }
  });

  // Resolve governorates and cities for our localized clinics
  const cairoGov = await p.governorate.findFirst({ where: { nameAr: 'القاهرة' } });
  const nasrCity = await p.city.findFirst({ where: { nameAr: 'مدينة نصر' } });

  const gizaGov = await p.governorate.findFirst({ where: { nameAr: 'الجيزة' } });
  const dokkiCity = await p.city.findFirst({ where: { nameAr: 'الدقي' } });

  const alexGov = await p.governorate.findFirst({ where: { nameAr: 'الإسكندرية' } });
  const smouhaCity = await p.city.findFirst({ where: { nameAr: 'سموحة' } });

  // 3. Seed Mock Medications for Pharma Insights & Prescription Items
  console.log('💊 Seeding medical drugs inventory...');
  const augmentin = await prisma.medication.create({
    data: { name: 'Augmentin 1g', activeIngredient: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotic', strength: '1000mg', form: 'أقراص', isGlobal: true }
  });
  const panadol = await prisma.medication.create({
    data: { name: 'Panadol Advance', activeIngredient: 'Paracetamol', category: 'Analgesic', strength: '500mg', form: 'أقراص', isGlobal: true }
  });
  const concor = await prisma.medication.create({
    data: { name: 'Concor 5mg', activeIngredient: 'Bisoprolol Fumarate', category: 'Cardiology', strength: '5mg', form: 'أقراص', isGlobal: true }
  });
  const brufen = await prisma.medication.create({
    data: { name: 'Brufen 400mg', activeIngredient: 'Ibuprofen', category: 'Analgesic/Anti-inflammatory', strength: '400mg', form: 'أقراص', isGlobal: true }
  });
  const janumet = await prisma.medication.create({
    data: { name: 'Janumet 50/1000mg', activeIngredient: 'Sitagliptin + Metformin', category: 'Antidiabetic', strength: '50mg/1000mg', form: 'أقراص', isGlobal: true }
  });
  const amoxicillin = await prisma.medication.create({
    data: { name: 'Amoxicillin 500mg', activeIngredient: 'Amoxicillin', category: 'Antibiotic', strength: '500mg', form: 'كبسولات', isGlobal: true }
  });

  // =========================================================================
  // ── CLINIC SCENARIO 1: CARDIOVASCULAR HEALTH CLINIC (PRO PLAN)
  // =========================================================================
  console.log('🏥 Seeding Scenario 1: Dr. Mahdy Cardiovascular Clinic (Cairo)...');
  const clinic1 = await p.clinic.create({
    data: {
      name: 'عيادة د. المهدي لأمراض القلب',
      address: 'شارع الطيران، مدينة نصر، القاهرة',
      phone: '01011111111',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      governorateId: cairoGov?.id,
      cityId: nasrCity?.id,
      settings: { create: { currency: 'EGP', timezone: 'Africa/Cairo' } }
    }
  });

  const doc1User = await prisma.user.create({
    data: { clinicId: clinic1.id, email: 'doctor@clinicpro.com', password: hash('doctor123'), name: 'د. طارق المهدي', role: 'DOCTOR' }
  });

  const doctor1 = await prisma.doctor.create({
    data: { clinicId: clinic1.id, userId: doc1User.id, specialization: 'Cardiologist', consultationFee: 600, status: 'active' }
  });

  console.log('\n======================================================');
  console.log('      MINIMAL CLINICPRO SEED COMPLETED SUCCESSFULLY  ');
  console.log('======================================================');
  console.log('  Login Credentials:');
  console.log('  --------------------------------------------------');
  console.log('  - Platform Owner:  owner@clinicpro.com  / owner123');
  console.log('  --------------------------------------------------');
  console.log('  - Clinic 1 (PRO):   doctor@clinicpro.com / doctor123 (Doctor)');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding Process Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
