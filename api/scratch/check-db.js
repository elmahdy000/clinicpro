const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const clinics = await prisma.clinic.findMany();
    console.log("Clinics:", clinics.map(c => ({ id: c.id, name: c.name })));

    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, clinicId: true } });
    console.log("Users:", users);

    const doctors = await prisma.doctor.findMany({ include: { user: true } });
    console.log("Doctors:", doctors.map(d => ({ id: d.id, name: d.user?.name, specialization: d.specialization, clinicId: d.clinicId })));

    const patients = await prisma.patient.findMany();
    console.log("Patients count:", patients.length);
    console.log("First 3 Patients:", patients.slice(0, 3).map(p => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone, userId: p.userId })));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
