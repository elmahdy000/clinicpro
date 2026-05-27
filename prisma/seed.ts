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
  const admin1User = await prisma.user.create({
    data: { clinicId: clinic1.id, email: 'admin@clinicpro.com', password: hash('admin123'), name: 'أ. سامح (إداري)', role: 'CLINIC_ADMIN' }
  });

  const doctor1 = await prisma.doctor.create({
    data: { clinicId: clinic1.id, userId: doc1User.id, specialization: 'Cardiologist', consultationFee: 600, status: 'active' }
  });

  // Patients for Clinic 1
  const pat1_1 = await prisma.patient.create({
    data: {
      firstName: 'أحمد', lastName: 'علي عبد الله', email: 'ahmed.ali@gmail.com', phone: '01211111111',
      dateOfBirth: new Date('1980-05-12'), gender: 'Male', bloodGroup: 'A+', governorateId: cairoGov?.id, cityId: nasrCity?.id,
      clinics: { create: { clinicId: clinic1.id } }
    }
  });

  const pat1_2 = await prisma.patient.create({
    data: {
      firstName: 'مصطفى', lastName: 'كامل الشريف', email: 'mustafa.kamel@yahoo.com', phone: '01122222222',
      dateOfBirth: new Date('1958-11-23'), gender: 'Male', bloodGroup: 'O+', governorateId: cairoGov?.id, cityId: nasrCity?.id,
      clinics: { create: { clinicId: clinic1.id } }
    }
  });

  // Visits & Prescriptions for Patient 1.1 (Chest Pain Case)
  const app1_1 = await prisma.appointment.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_1.id, doctorId: doctor1.id,
      appointmentDate: new Date(Date.now() - 3 * 24 * 60000 * 60), // 3 days ago
      appointmentEndDate: new Date(Date.now() - 3 * 24 * 60000 * 60 + 30 * 60000),
      type: 'كشف جديد', reason: 'آلام مفاجئة في الصدر وضيق تنفس', status: 'COMPLETED'
    }
  });

  const rec1_1 = await prisma.medicalRecord.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_1.id, doctorId: doctor1.id, appointmentId: app1_1.id,
      chiefComplaint: 'ألم ضاغط في وسط الصدر يمتد للكتف الأيسر عند المجهود',
      diagnosis: 'Angina Pectoris (ذبحة صدرية مستقرة)',
      treatmentPlan: 'متابعة وظائف القلب، راحة تامة، وتجنب الانفعال مع الالتزام بالدواء فوراً',
      vitalSigns: JSON.stringify({ bp: '135/85', hr: '88', temp: '36.8', wt: '82' })
    }
  });

  const pres1_1 = await prisma.prescription.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_1.id, doctorId: doctor1.id, medicalRecordId: rec1_1.id,
      instructions: 'تؤخذ الحبة الأولى صباحاً قبل الإفطار مباشرة',
      medications: '[{"name":"Concor 5mg","dosage":"5mg","frequency":"Once daily"}]'
    }
  });

  await p.prescriptionItem.create({
    data: { prescriptionId: pres1_1.id, medicationId: concor.id, dosage: '5mg', frequency: 'مرة واحدة يومياً', duration: 'لمدة شهر', instructions: 'قبل الإفطار' }
  });

  await prisma.invoice.create({
    data: {
      clinicId: clinic1.id, invoiceNumber: 'INV-1001', patientId: pat1_1.id, doctorId: doctor1.id, appointmentId: app1_1.id,
      items: JSON.stringify([{ description: 'كشف طبي شامل قلب وأوعية دموية', price: 600 }]),
      subtotal: 600, total: 600, status: 'PAID', paymentMethod: 'CASH', paidAt: new Date(), dueDate: new Date()
    }
  });

  // Visits & Prescriptions for Patient 1.2 (Hypertension & Diabetes Check)
  const app1_2 = await prisma.appointment.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_2.id, doctorId: doctor1.id,
      appointmentDate: new Date(Date.now() - 1 * 24 * 60000 * 60), // Yesterday
      appointmentEndDate: new Date(Date.now() - 1 * 24 * 60000 * 60 + 30 * 60000),
      type: 'استشارة', reason: 'متابعة دورية للضغط والسكر', status: 'COMPLETED'
    }
  });

  const rec1_2 = await prisma.medicalRecord.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_2.id, doctorId: doctor1.id, appointmentId: app1_2.id,
      chiefComplaint: 'ارتفاع مستويات السكر الصائم في المنزل وتذبذب قراءات الضغط',
      diagnosis: 'Type 2 Diabetes & Chronic Hypertension (مرض السكري والضغط المزمن)',
      treatmentPlan: 'التزام بحمية غذائية قليلة النشويات والصوديوم مع إعادة التحليل خلال أسبوعين',
      vitalSigns: JSON.stringify({ bp: '150/95', hr: '76', temp: '36.6', wt: '90' })
    }
  });

  const pres1_2 = await prisma.prescription.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_2.id, doctorId: doctor1.id, medicalRecordId: rec1_2.id,
      instructions: 'تؤخذ الأدوية بانتظام تام في مواعيد ثابتة',
      medications: '[{"name":"Concor 5mg","dosage":"5mg","frequency":"Once daily"},{"name":"Janumet 50/1000mg","dosage":"50/1000mg","frequency":"Twice daily"}]'
    }
  });

  await p.prescriptionItem.create({
    data: { prescriptionId: pres1_2.id, medicationId: concor.id, dosage: '5mg', frequency: 'مرة واحدة صباحاً', duration: 'مستمر', instructions: 'بعد الأكل' }
  });
  await p.prescriptionItem.create({
    data: { prescriptionId: pres1_2.id, medicationId: janumet.id, dosage: '50/1000mg', frequency: 'مرتين يومياً', duration: 'مستمر', instructions: 'مع وجبتي الإفطار والعشاء' }
  });

  await prisma.invoice.create({
    data: {
      clinicId: clinic1.id, invoiceNumber: 'INV-1002', patientId: pat1_2.id, doctorId: doctor1.id, appointmentId: app1_2.id,
      items: JSON.stringify([{ description: 'استشارة طبية ومتابعة تحاليل', price: 200 }]),
      subtotal: 200, total: 200, status: 'PAID', paymentMethod: 'CASH', paidAt: new Date(), dueDate: new Date()
    }
  });

  // Future scheduled appointment for Patient 1.2
  await prisma.appointment.create({
    data: {
      clinicId: clinic1.id, patientId: pat1_2.id, doctorId: doctor1.id,
      appointmentDate: new Date(Date.now() + 14 * 24 * 60000 * 60), // 14 days from now
      appointmentEndDate: new Date(Date.now() + 14 * 24 * 60000 * 60 + 30 * 60000),
      type: 'استشارة ومتابعة تحاليل', status: 'PENDING'
    }
  });

  // =========================================================================
  // ── CLINIC SCENARIO 2: PEDIATRIC SPECIALTY CLINIC (BASIC PLAN)
  // =========================================================================
  console.log('🏥 Seeding Scenario 2: Dr. Sarah Pediatric Specialty Clinic (Giza)...');
  const clinic2 = await p.clinic.create({
    data: {
      name: 'عيادة الأمل التخصصية للأطفال',
      address: 'شارع التحرير، الدقي، الجيزة',
      phone: '02022222222',
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      governorateId: gizaGov?.id,
      cityId: dokkiCity?.id,
      settings: { create: { currency: 'EGP', timezone: 'Africa/Cairo' } }
    }
  });

  const doc2User = await prisma.user.create({
    data: { clinicId: clinic2.id, email: 'sarah@clinicpro.com', password: hash('doctor123'), name: 'د. سارة أحمد', role: 'DOCTOR' }
  });
  const admin2User = await prisma.user.create({
    data: { clinicId: clinic2.id, email: 'sarah_admin@clinicpro.com', password: hash('admin123'), name: 'أ. مروة (ممرضة العيادة)', role: 'CLINIC_ADMIN' }
  });

  const doctor2 = await prisma.doctor.create({
    data: { clinicId: clinic2.id, userId: doc2User.id, specialization: 'Pediatrician', consultationFee: 400, status: 'active' }
  });

  // Pediatric Patient
  const pat2_1 = await prisma.patient.create({
    data: {
      firstName: 'ياسين', lastName: 'محمد رشاد', email: 'yassin.mohamed@gmail.com', phone: '01099999999',
      dateOfBirth: new Date('2021-04-10'), gender: 'Male', bloodGroup: 'B+', governorateId: gizaGov?.id, cityId: dokkiCity?.id,
      clinics: { create: { clinicId: clinic2.id } }
    }
  });

  // Visit & Prescription (Acute Tonsillitis Case)
  const app2_1 = await prisma.appointment.create({
    data: {
      clinicId: clinic2.id, patientId: pat2_1.id, doctorId: doctor2.id,
      appointmentDate: new Date(Date.now() - 2 * 24 * 60000 * 60), // 2 days ago
      appointmentEndDate: new Date(Date.now() - 2 * 24 * 60000 * 60 + 30 * 60000),
      type: 'كشف أطفال', reason: 'ارتفاع حاد في الحرارة وصعوبة بلع', status: 'COMPLETED'
    }
  });

  const rec2_1 = await prisma.medicalRecord.create({
    data: {
      clinicId: clinic2.id, patientId: pat2_1.id, doctorId: doctor2.id, appointmentId: app2_1.id,
      chiefComplaint: 'حرارة مرتفعة منذ ليلة أمس، كحة ورفض كامل للأكل والرضاعة',
      diagnosis: 'Acute Bacterial Tonsillitis (التهاب لوزتين بكتيري حاد)',
      treatmentPlan: 'مضاد حيوي عن طريق الفم مع خافض حرارة دوري، شرب سوائل دافئة بكثرة ومتابعة الحرارة',
      vitalSigns: JSON.stringify({ bp: '95/60', hr: '105', temp: '38.5', wt: '18' })
    }
  });

  const pres2_1 = await prisma.prescription.create({
    data: {
      clinicId: clinic2.id, patientId: pat2_1.id, doctorId: doctor2.id, medicalRecordId: rec2_1.id,
      instructions: 'يرجى رج زجاجة المضاد الحيوي جيداً قبل الاستعمال ويحفظ في الثلاجة',
      medications: '[{"name":"Augmentin 1g","dosage":"5ml","frequency":"Every 12 hours"},{"name":"Brufen 400mg","dosage":"4ml","frequency":"Every 8 hours when necessary"}]'
    }
  });

  await p.prescriptionItem.create({
    data: { prescriptionId: pres2_1.id, medicationId: augmentin.id, dosage: '5ml', frequency: 'كل ١٢ ساعة بانتظام', duration: 'لمدة ٧ أيام', instructions: 'بعد الرضاعة/الأكل' }
  });
  await p.prescriptionItem.create({
    data: { prescriptionId: pres2_1.id, medicationId: brufen.id, dosage: '4ml', frequency: 'كل ٨ ساعات عند اللزوم', duration: 'لمدة ٣ أيام', instructions: 'عند ارتفاع الحرارة فوق ٣٨' }
  });

  await prisma.invoice.create({
    data: {
      clinicId: clinic2.id, invoiceNumber: 'INV-2001', patientId: pat2_1.id, doctorId: doctor2.id, appointmentId: app2_1.id,
      items: JSON.stringify([{ description: 'كشف طبي تخصصي أطفال ومتابعة نمو', price: 400 }]),
      subtotal: 400, total: 400, status: 'PAID', paymentMethod: 'CASH', paidAt: new Date(), dueDate: new Date()
    }
  });

  // =========================================================================
  // ── CLINIC SCENARIO 3: DENTAL & COSMETIC CLINIC (ENTERPRISE PLAN)
  // =========================================================================
  console.log('🏥 Seeding Scenario 3: Dr. Youssef Dental Center (Alexandria)...');
  const clinic3 = await p.clinic.create({
    data: {
      name: 'مركز سموحة لتجميل وزراعة الأسنان',
      address: 'شارع فوزي معاذ، سموحة، الإسكندرية',
      phone: '03033333333',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      governorateId: alexGov?.id,
      cityId: smouhaCity?.id,
      settings: { create: { currency: 'EGP', timezone: 'Africa/Cairo' } }
    }
  });

  const doc3User = await prisma.user.create({
    data: { clinicId: clinic3.id, email: 'youssef@clinicpro.com', password: hash('doctor123'), name: 'د. يوسف شريف', role: 'DOCTOR' }
  });
  const admin3User = await prisma.user.create({
    data: { clinicId: clinic3.id, email: 'youssef_admin@clinicpro.com', password: hash('admin123'), name: 'أ. نادين (منسقة المواعيد)', role: 'CLINIC_ADMIN' }
  });

  const doctor3 = await prisma.doctor.create({
    data: { clinicId: clinic3.id, userId: doc3User.id, specialization: 'Dentist', consultationFee: 1000, status: 'active' }
  });

  // Dental Patient
  const pat3_1 = await prisma.patient.create({
    data: {
      firstName: 'نادية', lastName: 'محمود البسيوني', email: 'nadia.bassyouni@outlook.com', phone: '01533333333',
      dateOfBirth: new Date('1994-08-05'), gender: 'Female', bloodGroup: 'AB-', governorateId: alexGov?.id, cityId: smouhaCity?.id,
      clinics: { create: { clinicId: clinic3.id } }
    }
  });

  // Root Canal Treatment Case
  const app3_1 = await prisma.appointment.create({
    data: {
      clinicId: clinic3.id, patientId: pat3_1.id, doctorId: doctor3.id,
      appointmentDate: new Date(Date.now() - 4 * 24 * 60000 * 60), // 4 days ago
      appointmentEndDate: new Date(Date.now() - 4 * 24 * 60000 * 60 + 45 * 60000),
      type: 'جلسة علاج عصب', reason: 'ألم حاد ومستمر في الضرس الخلفي السفلي', status: 'COMPLETED'
    }
  });

  const rec3_1 = await prisma.medicalRecord.create({
    data: {
      clinicId: clinic3.id, patientId: pat3_1.id, doctorId: doctor3.id, appointmentId: app3_1.id,
      chiefComplaint: 'ألم حاد نابض يزداد ليلاً مع السوائل الباردة والساخنة، ولا يستجيب للمسكنات البسيطة',
      diagnosis: 'Irreversible Pulpitis - Lower Left 1st Molar (التهاب عصب الضرس السفلي الأيسر غير ارتجاعي)',
      treatmentPlan: 'تنظيف قنوات العصب بالكامل وتطهيرها مع وضع حشوة مؤقتة، تمهيداً لحشو العصب النهائي وتركيب طربوش حماية',
      vitalSigns: JSON.stringify({ bp: '118/75', hr: '80', temp: '37.0', wt: '65' })
    }
  });

  const pres3_1 = await prisma.prescription.create({
    data: {
      clinicId: clinic3.id, patientId: pat3_1.id, doctorId: doctor3.id, medicalRecordId: rec3_1.id,
      instructions: 'تجنب الأكل على الجانب الأيسر طوال فترة الحشو المؤقت',
      medications: '[{"name":"Amoxicillin 500mg","dosage":"500mg","frequency":"Every 8 hours"},{"name":"Brufen 400mg","dosage":"400mg","frequency":"Every 12 hours after meals"}]'
    }
  });

  await p.prescriptionItem.create({
    data: { prescriptionId: pres3_1.id, medicationId: amoxicillin.id, dosage: '500mg', frequency: 'كل ٨ ساعات بانتظام', duration: 'لمدة ٥ أيام', instructions: 'بعد الأكل لتجنب آلام المعدة' }
  });
  await p.prescriptionItem.create({
    data: { prescriptionId: pres3_1.id, medicationId: brufen.id, dosage: '400mg', frequency: 'مرة كل ١٢ ساعة', duration: 'لمدة ٣ أيام', instructions: 'بعد الأكل مباشرة عند الشعور بالألم' }
  });

  // Dental treatment carries a larger subtotal, simulated with partial status!
  await prisma.invoice.create({
    data: {
      clinicId: clinic3.id, invoiceNumber: 'INV-3001', patientId: pat3_1.id, doctorId: doctor3.id, appointmentId: app3_1.id,
      items: JSON.stringify([
        { description: 'علاج قنوات جذر عصب الضرس وحشوه', price: 1200 },
        { description: 'كشف أشعة سينية رقمية للضرس', price: 300 }
      ]),
      subtotal: 1500, total: 1500, status: 'PARTIAL', paymentMethod: 'CASH', paidAt: null, dueDate: new Date(),
      notes: 'تم سداد ١٠٠٠ ج.م نقداً عند الجلسة الأولى، ومتبقي ٥٠٠ ج.م تسدد عند الحشو النهائي.'
    }
  });

  // =========================================================================
  // ── SEEDING SAAS SUBSCRIPTION INVOICES BETWEEN CLINICPRO PLATFORM AND CLINICS
  // =========================================================================
  console.log('💳 Seeding SaaS platform billing invoices...');
  
  // We can simulate Platform SaaS invoices as mock entries in the Invoice table with a dummy patient or distinct status
  // For standard clinic SaaS billing, we simulate a system ledger log!
  // Since we also want robust logs:
  await prisma.auditLog.create({
    data: { clinicId: clinic1.id, action: 'PLAN_UPGRADE', details: 'Clinic upgraded to PRO subscription plan successfully.' }
  });
  await prisma.auditLog.create({
    data: { clinicId: clinic2.id, action: 'PLAN_ACTIVATED', details: 'Clinic registered and activated BASIC tier.' }
  });
  await prisma.auditLog.create({
    data: { clinicId: clinic3.id, action: 'PLAN_UPGRADE', details: 'SLA custom integration finalized for ENTERPRISE custom node.' }
  });

  console.log('\n======================================================');
  console.log('      MULTI-SCENARIO SEED COMPLETED SUCCESSFULLY      ');
  console.log('======================================================');
  console.log('  Login Credentials:');
  console.log('  --------------------------------------------------');
  console.log('  - Platform Owner:  owner@clinicpro.com  / owner123');
  console.log('  --------------------------------------------------');
  console.log('  - Clinic 1 (PRO):   admin@clinicpro.com  / admin123 (Admin)');
  console.log('                      doctor@clinicpro.com / doctor123 (Doctor)');
  console.log('  --------------------------------------------------');
  console.log('  - Clinic 2 (BASIC): sarah_admin@clinicpro.com / admin123 (Admin)');
  console.log('                      sarah@clinicpro.com       / doctor123 (Doctor)');
  console.log('  --------------------------------------------------');
  console.log('  - Clinic 3 (ENT):   youssef_admin@clinicpro.com / admin123 (Admin)');
  console.log('                      youssef@clinicpro.com       / doctor123 (Doctor)');
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
