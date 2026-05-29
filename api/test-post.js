const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const inv = await prisma.subscriptionInvoice.create({
      data: {
        clinicId: 1,
        invoiceNumber: `INV-${Date.now()}`,
        plan: 'PRO',
        amount: 599,
        status: 'PENDING',
        billingPeriod: 'monthly',
        dueDate: new Date('2026-06-15T00:00:00.000Z'),
        paymentDate: null,
        notes: 'Manually issued via platform console.',
      }
    });
    console.log("Success:", inv);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
