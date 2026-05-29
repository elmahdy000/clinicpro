const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const records = await prisma.medicalRecord.findMany({
      include: { patient: true }
    });
    console.log("Medical Records:", records.map(r => ({
      id: r.id,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      diagnosis: r.diagnosis,
      createdAt: r.createdAt
    })));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
