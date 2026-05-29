const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    const clinicId = doctor.clinicId;

    // find/create medication
    let med = await prisma.medication.findFirst();
    if (!med) {
      med = await prisma.medication.create({
        data: {
          name: 'Panadol Extra',
          activeIngredient: 'Paracetamol',
          price: 50
        }
      });
    }

    // create medication stock
    const stock = await prisma.medicationStock.create({
      data: {
        medicationId: med.id,
        clinicId,
        quantityOnHand: 15,
        batchNumber: 'BATCH-001',
        expiryDate: null, // null testing
        lastRestockedAt: null, // null testing
      }
    });

    console.log("Created stock:", stock);

    // Now query it like findAll
    const where = { clinicId };
    const data = await prisma.medicationStock.findMany({
      where,
      include: { medication: true, stockMovements: { take: 5, orderBy: { createdAt: 'desc' } } },
      skip: 0,
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    const mapped = data.map((s) => ({
      ...s,
      expiryDate: s.expiryDate?.toISOString(),
      lastRestockedAt: s.lastRestockedAt?.toISOString(),
      isLowStock: s.quantityOnHand <= 10,
      isExpired: s.expiryDate ? new Date(s.expiryDate) < new Date() : false,
    }));

    console.log("Mapped items:", mapped);

    // Clean up
    await prisma.medicationStock.delete({ where: { id: stock.id } });
    console.log("Cleaned up successfully.");
  } catch (e) {
    console.error("ERROR during insert-and-test:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
