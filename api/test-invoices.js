const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const invoices = await prisma.subscriptionInvoice.findMany({
      include: {
        clinic: {
          include: {
            governorate: true,
            city: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = invoices.map(inv => ({
      id: `INV-2026-${String(inv.id).padStart(5, '0')}`,
      rawId: inv.id,
      clinicNameAr: inv.clinic.name,
      clinicNameEn: inv.clinic.name,
      planCode: inv.plan,
      billingCycle: inv.billingPeriod,
      amount: inv.amount,
      status: inv.status,
      createdAt: inv.createdAt.toISOString().split('T')[0],
      dueDate: inv.dueDate.toISOString().split('T')[0],
      paidAt: inv.paymentDate ? inv.paymentDate.toISOString().split('T')[0] : null,
      transactionId: inv.status === 'PAID' ? `TXN-2026-${inv.id * 1000}` : null,
      governorateAr: inv.clinic.governorate?.nameAr || '',
      governorateEn: inv.clinic.governorate?.nameEn || '',
      cityAr: inv.clinic.city?.nameAr || '',
      cityEn: inv.clinic.city?.nameEn || '',
      notes: inv.notes || '',
    }));
    console.log("Success mapped items:", mapped.length);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
