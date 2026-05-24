import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDepartments() {
  const depts = [
    { name: 'Cardiology', description: 'Heart and cardiovascular system' },
    { name: 'Neurology', description: 'Brain and nervous system' },
    { name: 'Orthopedics', description: 'Bones, joints, and muscles' },
    { name: 'Pediatrics', description: 'Medical care for children' },
    { name: 'General Medicine', description: 'General healthcare and internal medicine' },
    { name: 'Dermatology', description: 'Skin, hair, and nail conditions' },
    { name: 'Ophthalmology', description: 'Eye and vision care' },
  ];
  const departments = [];
  for (const d of depts) {
    departments.push(await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    }));
  }
  console.log(`✓ ${departments.length} departments seeded`);
  return departments;
}

async function seedUsers() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const usersData = [
    { email: 'admin@clinicpro.com', password: hash('admin123'), name: 'Admin User', role: 'ADMIN' },
    { email: 'doctor@clinicpro.com', password: hash('doctor123'), name: 'د. المهدي', role: 'DOCTOR' },
    { email: 'nurse1@clinicpro.com', password: hash('nurse123'), name: 'ممرضة مريم', role: 'NURSE' },
    { email: 'nurse2@clinicpro.com', password: hash('nurse123'), name: 'ممرض خالد', role: 'NURSE' },
    { email: 'reception@clinicpro.com', password: hash('reception123'), name: 'سارة عبدالله', role: 'RECEPTIONIST' },
    { email: 'patient1@clinicpro.com', password: hash('patient123'), name: 'أحمد علي', role: 'PATIENT' },
    { email: 'patient2@clinicpro.com', password: hash('patient123'), name: 'فاطمة حسن', role: 'PATIENT' },
    { email: 'patient3@clinicpro.com', password: hash('patient123'), name: 'محمد إبراهيم', role: 'PATIENT' },
    { email: 'patient4@clinicpro.com', password: hash('patient123'), name: 'عائشة محمود', role: 'PATIENT' },
    { email: 'patient5@clinicpro.com', password: hash('patient123'), name: 'عمر عبدالرحمن', role: 'PATIENT' },
    { email: 'patient6@clinicpro.com', password: hash('patient123'), name: 'نور مصطفى', role: 'PATIENT' },
    { email: 'patient7@clinicpro.com', password: hash('patient123'), name: 'خالد يوسف', role: 'PATIENT' },
    { email: 'patient8@clinicpro.com', password: hash('patient123'), name: 'سلمى طارق', role: 'PATIENT' },
  ];
  const users = [];
  for (const u of usersData) {
    users.push(await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    }));
  }
  console.log(`✓ ${users.length} users seeded`);
  return users;
}

async function seedDoctors(users: any[], departments: any[]) {
  const getUser = (email: string) => users.find((u: any) => u.email === email)!;
  const getDept = (name: string) => departments.find((d: any) => d.name === name)!;

  const profiles = [
    { userId: getUser('doctor@clinicpro.com').id, departmentId: getDept('General Medicine').id, specialization: 'General Physician', consultationFee: 500, status: 'active' },
  ];
  const doctors = [];
  for (const d of profiles) {
    doctors.push(await prisma.doctor.upsert({
      where: { userId: d.userId },
      update: {},
      create: d,
    }));
  }
  console.log(`✓ ${doctors.length} doctor profiles seeded`);
  return doctors;
}

async function seedPatients(users: any[]) {
  const getUser = (email: string) => users.find((u: any) => u.email === email)!;
  const profiles = [
    { userId: getUser('patient1@clinicpro.com').id, firstName: 'أحمد', lastName: 'علي', email: 'patient1@clinicpro.com', phone: '01234567890', dateOfBirth: new Date('1985-03-15'), gender: 'Male', address: '12 شارع النيل، القاهرة', bloodGroup: 'O+', allergies: 'بنسلين', medicalHistory: 'ربو', emergencyContact: '01000000001' },
    { userId: getUser('patient2@clinicpro.com').id, firstName: 'فاطمة', lastName: 'حسن', email: 'patient2@clinicpro.com', phone: '01234567891', dateOfBirth: new Date('1990-07-22'), gender: 'Female', address: '5 شارع البحر، الإسكندرية', bloodGroup: 'A+', allergies: '', medicalHistory: '', emergencyContact: '01000000002' },
    { userId: getUser('patient3@clinicpro.com').id, firstName: 'محمد', lastName: 'إبراهيم', email: 'patient3@clinicpro.com', phone: '01234567892', dateOfBirth: new Date('1978-11-02'), gender: 'Male', address: '78 شارع الجمهورية، الجيزة', bloodGroup: 'B+', allergies: 'سلفا', medicalHistory: 'سكري نوع 2', emergencyContact: '01000000003' },
    { userId: getUser('patient4@clinicpro.com').id, firstName: 'عائشة', lastName: 'محمود', email: 'patient4@clinicpro.com', phone: '01234567893', dateOfBirth: new Date('1965-05-18'), gender: 'Female', address: '21 شارع السعادة، الدقي', bloodGroup: 'AB-', allergies: 'لاتكس', medicalHistory: 'ضغط مرتفع', emergencyContact: '01000000004' },
    { userId: getUser('patient5@clinicpro.com').id, firstName: 'عمر', lastName: 'عبدالرحمن', email: 'patient5@clinicpro.com', phone: '01234567894', dateOfBirth: new Date('2000-01-30'), gender: 'Male', address: '33 شارع الهرم، فيصل', bloodGroup: 'O-', allergies: 'فول سوداني', medicalHistory: 'إكزيما', emergencyContact: '01000000005' },
    { userId: getUser('patient6@clinicpro.com').id, firstName: 'نور', lastName: 'مصطفى', email: 'patient6@clinicpro.com', phone: '01234567895', dateOfBirth: new Date('1995-09-12'), gender: 'Female', address: '15 شارع شبرا، القاهرة', bloodGroup: 'A-', allergies: '', medicalHistory: 'صداع نصفي', emergencyContact: '01000000006' },
    { userId: getUser('patient7@clinicpro.com').id, firstName: 'خالد', lastName: 'يوسف', email: 'patient7@clinicpro.com', phone: '01234567896', dateOfBirth: new Date('1972-12-25'), gender: 'Male', address: '8 شارع فيصل، الجيزة', bloodGroup: 'B-', allergies: 'إيبوبروفين', medicalHistory: 'التهاب مفاصل', emergencyContact: '01000000007' },
    { userId: getUser('patient8@clinicpro.com').id, firstName: 'سلمى', lastName: 'طارق', email: 'patient8@clinicpro.com', phone: '01234567897', dateOfBirth: new Date('2005-06-08'), gender: 'Female', address: '44 شارع المطار، مدينة نصر', bloodGroup: 'AB+', allergies: 'غبار', medicalHistory: '', emergencyContact: '01000000008' },
  ];
  const patients = [];
  for (const p of profiles) {
    patients.push(await prisma.patient.upsert({
      where: { email: p.email },
      update: {},
      create: p,
    }));
  }
  console.log(`✓ ${patients.length} patient profiles seeded`);
  return patients;
}

async function seedAppointments(patients: any[], doctors: any[]) {
  const getPatient = (email: string) => patients.find((p: any) => p.email === email)!;
  const now = new Date();
  const past = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return d; };
  const future = (days: number) => { const d = new Date(now); d.setDate(d.getDate() + days); return d; };
  const endDate = (start: Date, mins: number) => { const d = new Date(start); d.setMinutes(d.getMinutes() + mins); return d; };

  const data = [
    { patientId: getPatient('patient1@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(2), appointmentEndDate: endDate(past(2), 30), durationMinutes: 30, type: 'Checkup', reason: 'Chest pain', status: 'COMPLETED' },
    { patientId: getPatient('patient2@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(1), appointmentEndDate: endDate(past(1), 45), durationMinutes: 45, type: 'Consultation', reason: 'Headache', status: 'COMPLETED' },
    { patientId: getPatient('patient3@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(0), appointmentEndDate: endDate(past(0), 60), durationMinutes: 60, type: 'Surgery', reason: 'Knee pain', status: 'CONFIRMED' },
    { patientId: getPatient('patient4@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(1), appointmentEndDate: endDate(future(1), 30), durationMinutes: 30, type: 'Checkup', reason: 'Child fever', status: 'CONFIRMED' },
    { patientId: getPatient('patient5@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(2), appointmentEndDate: endDate(future(2), 15), durationMinutes: 15, type: 'Follow-up', reason: 'Blood test results', status: 'PENDING' },
    { patientId: getPatient('patient6@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(3), appointmentEndDate: endDate(future(3), 30), durationMinutes: 30, type: 'Emergency', reason: 'Palpitations', status: 'PENDING' },
    { patientId: getPatient('patient7@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(5), appointmentEndDate: endDate(past(5), 45), durationMinutes: 45, type: 'Consultation', reason: 'Memory loss', status: 'COMPLETED' },
    { patientId: getPatient('patient8@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(3), appointmentEndDate: endDate(past(3), 30), durationMinutes: 30, type: 'Checkup', reason: 'Growth monitoring', status: 'COMPLETED' },
    { patientId: getPatient('patient1@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(5), appointmentEndDate: endDate(future(5), 30), durationMinutes: 30, type: 'Follow-up', reason: 'Review', status: 'PENDING' },
    { patientId: getPatient('patient2@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(7), appointmentEndDate: endDate(past(7), 20), durationMinutes: 20, type: 'Follow-up', reason: 'Medication check', status: 'COMPLETED' },
    { patientId: getPatient('patient3@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(7), appointmentEndDate: endDate(future(7), 60), durationMinutes: 60, type: 'Surgery', reason: 'Heart surgery follow-up', status: 'CANCELLED' },
    { patientId: getPatient('patient4@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(10), appointmentEndDate: endDate(future(10), 30), durationMinutes: 30, type: 'Checkup', reason: 'Neurological exam', status: 'PENDING' },
    { patientId: getPatient('patient5@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(14), appointmentEndDate: endDate(past(14), 45), durationMinutes: 45, type: 'Consultation', reason: 'Shoulder injury', status: 'COMPLETED' },
    { patientId: getPatient('patient6@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: past(10), appointmentEndDate: endDate(past(10), 30), durationMinutes: 30, type: 'Checkup', reason: 'Routine check', status: 'COMPLETED' },
    { patientId: getPatient('patient7@clinicpro.com').id, doctorId: doctors[0].id, appointmentDate: future(14), appointmentEndDate: endDate(future(14), 30), durationMinutes: 30, type: 'Follow-up', reason: 'Diabetes management', status: 'CANCELLED' },
  ];
  const appointments = [];
  for (const a of data) {
    appointments.push(await prisma.appointment.create({ data: a }));
  }
  console.log(`✓ ${appointments.length} appointments seeded`);
  return appointments;
}

async function seedMedicalRecords(patients: any[], doctors: any[], appointments: any[]) {
  const getPatient = (email: string) => patients.find((p: any) => p.email === email)!;
  const data = [
    { patientId: getPatient('patient1@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[0].id, chiefComplaint: 'Chest pain and shortness of breath', diagnosis: 'Mild angina - stable condition', treatmentPlan: 'Prescribe nitroglycerin and schedule stress test', vitalSigns: JSON.stringify({ bp: '130/85', heartRate: 88, temperature: 98.6, oxygenSat: 97 }), notes: 'Patient advised to avoid strenuous activity' },
    { patientId: getPatient('patient2@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[1].id, chiefComplaint: 'Persistent headache for 2 weeks', diagnosis: 'Migraine without aura', treatmentPlan: 'Sumatriptan as needed, avoid triggers', vitalSigns: JSON.stringify({ bp: '120/80', heartRate: 72, temperature: 98.4, oxygenSat: 99 }), notes: 'Patient to keep headache diary' },
    { patientId: getPatient('patient7@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[6].id, chiefComplaint: 'Short-term memory loss and confusion', diagnosis: 'Mild cognitive impairment - early evaluation', treatmentPlan: 'Refer to memory clinic, start donepezil 5mg', vitalSigns: JSON.stringify({ bp: '145/90', heartRate: 76, temperature: 98.2, oxygenSat: 98 }), notes: 'Family history of Alzheimer disease' },
    { patientId: getPatient('patient8@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[7].id, chiefComplaint: 'Bone growth and development check', diagnosis: 'Normal growth pattern for age', treatmentPlan: 'Continue calcium and vitamin D supplements', vitalSigns: JSON.stringify({ bp: '110/70', heartRate: 80, temperature: 98.8, oxygenSat: 99 }), notes: 'Height at 75th percentile' },
    { patientId: getPatient('patient5@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[12].id, chiefComplaint: 'Right shoulder pain after lifting', diagnosis: 'Rotator cuff strain - Grade 1', treatmentPlan: 'Rest, ice, physical therapy 2x/week for 4 weeks', vitalSigns: JSON.stringify({ bp: '125/82', heartRate: 70, temperature: 98.4, oxygenSat: 98 }), notes: 'Avoid overhead lifting for 6 weeks' },
    { patientId: getPatient('patient6@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[13].id, chiefComplaint: 'Routine pediatric checkup', diagnosis: 'Healthy - no abnormalities', treatmentPlan: 'Continue regular checkups, vaccines up to date', vitalSigns: JSON.stringify({ bp: '115/75', heartRate: 78, temperature: 98.5, oxygenSat: 100 }), notes: '' },
    { patientId: getPatient('patient2@clinicpro.com').id, doctorId: doctors[0].id, appointmentId: appointments[9].id, chiefComplaint: 'Medication follow-up for blood pressure', diagnosis: 'Hypertension - Stage 1, well controlled', treatmentPlan: 'Continue current medication, monitor weekly', vitalSigns: JSON.stringify({ bp: '128/84', heartRate: 74, temperature: 98.3, oxygenSat: 98 }), notes: 'Lifestyle modifications discussed' },
  ];
  const records = [];
  for (const r of data) {
    records.push(await prisma.medicalRecord.create({ data: r }));
  }
  console.log(`✓ ${records.length} medical records seeded`);
  return records;
}

async function seedPrescriptions(patients: any[], doctors: any[], records: any[]) {
  const getPatient = (email: string) => patients.find((p: any) => p.email === email)!;
  const data = [
    { patientId: getPatient('patient1@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: records[0].id, medications: JSON.stringify([{ name: 'Nitroglycerin', dosage: '0.4mg', frequency: 'As needed sublingual', duration: '30 days' }, { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', duration: '90 days' }]), instructions: 'Take nitroglycerin at first sign of chest pain.' },
    { patientId: getPatient('patient2@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: records[1].id, medications: JSON.stringify([{ name: 'Sumatriptan', dosage: '50mg', frequency: 'At onset of migraine', duration: '10 doses' }, { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 6 hours as needed', duration: '5 days' }]), instructions: 'Take at first sign of migraine.' },
    { patientId: getPatient('patient7@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: records[2].id, medications: JSON.stringify([{ name: 'Donepezil', dosage: '5mg', frequency: 'Once daily at bedtime', duration: '30 days' }]), instructions: 'Take at bedtime. May cause dizziness.' },
    { patientId: getPatient('patient5@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: records[4].id, medications: JSON.stringify([{ name: 'Naproxen', dosage: '500mg', frequency: 'Twice daily with food', duration: '7 days' }, { name: 'Cyclobenzaprine', dosage: '10mg', frequency: 'Three times daily as needed', duration: '7 days' }]), instructions: 'Rest shoulder, apply ice pack 20 min 3x/day.' },
    { patientId: getPatient('patient6@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: records[5].id, medications: JSON.stringify([]), instructions: 'No medications prescribed at this time.' },
    { patientId: getPatient('patient2@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: records[6].id, medications: JSON.stringify([{ name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '90 days' }]), instructions: 'Take in the morning. Monitor blood pressure weekly.' },
    { patientId: getPatient('patient4@clinicpro.com').id, doctorId: doctors[0].id, medicalRecordId: null, medications: JSON.stringify([{ name: 'Amoxicillin', dosage: '250mg', frequency: 'Three times daily', duration: '7 days' }]), instructions: 'Take with food. Complete full course.' },
  ];
  const prescriptions = [];
  for (const p of data) {
    prescriptions.push(await prisma.prescription.create({ data: p }));
  }
  console.log(`✓ ${prescriptions.length} prescriptions seeded`);
  return prescriptions;
}

async function seedFiles() {
  const files = [];
  const data = [
    { fileName: 'xray-chest-001.pdf', fileType: 'application/pdf', url: '/uploads/xray-chest-001.pdf', uploadedBy: 1 },
    { fileName: 'mri-brain-002.dcm', fileType: 'application/dicom', url: '/uploads/mri-brain-002.dcm', uploadedBy: 2 },
    { fileName: 'blood-report-003.pdf', fileType: 'application/pdf', url: '/uploads/blood-report-003.pdf', uploadedBy: 3 },
    { fileName: 'prescription-scan-004.pdf', fileType: 'application/pdf', url: '/uploads/prescription-scan-004.pdf', uploadedBy: 4 },
  ];
  for (const f of data) {
    files.push(await prisma.fileUpload.create({ data: f }));
  }
  console.log(`✓ ${files.length} file uploads seeded`);
  return files;
}

async function seedOtps() {
  const future = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };
  const otps = [];
  const data = [
    { email: 'patient1@clinicpro.com', otp: '123456', expiresAt: future(1), attempts: 0 },
    { email: 'patient3@clinicpro.com', otp: '654321', expiresAt: future(1), attempts: 1 },
  ];
  for (const o of data) {
    otps.push(await prisma.otpVerification.create({ data: o }));
  }
  console.log(`✓ ${otps.length} OTP verifications seeded`);
  return otps;
}

async function main() {
  console.log('\nSeeding database...\n');

  const departments = await seedDepartments();
  const users = await seedUsers();
  const doctors = await seedDoctors(users, departments);
  const patients = await seedPatients(users);
  const appointments = await seedAppointments(patients, doctors);
  const records = await seedMedicalRecords(patients, doctors, appointments);
  const prescriptions = await seedPrescriptions(patients, doctors, records);
  await seedFiles();
  await seedOtps();

  console.log('\n═══════════════════════════════════════');
  console.log('  SEED COMPLETED SUCCESSFULLY');
  console.log('═══════════════════════════════════════');
  console.log(`  Users:         ${users.length}`);
  console.log(`  Doctors:       ${doctors.length}`);
  console.log(`  Patients:      ${patients.length}`);
  console.log(`  Departments:   ${departments.length}`);
  console.log(`  Appointments:  ${appointments.length}`);
  console.log(`  Records:       ${records.length}`);
  console.log(`  Prescriptions: ${prescriptions.length}`);
  console.log('───────────────────────────────────────');
  console.log('  Login creds:');
  console.log('  Admin:    admin@clinicpro.com / admin123');
  console.log('  Doctor:   doctor@clinicpro.com / doctor123');
  console.log('  Patient:  patient1@clinicpro.com / patient123');
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
