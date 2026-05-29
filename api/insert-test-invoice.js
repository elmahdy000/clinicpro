const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      console.log("No clinic found");
      return;
    }
    const inv = await prisma.subscriptionInvoice.create({
      data: {
        clinicId: clinic.id,
        invoiceNumber: "INV-9999",
        plan: "PRO",
        amount: 500,
        status: "PENDING",
        billingPeriod: "June 2026",
        dueDate: new Date(),
      }
    });
    console.log("Inserted test invoice", inv.id);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
