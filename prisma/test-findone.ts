import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const p = prisma as any;

async function main() {
  console.log('Fetching all clinics in database...');
  const clinics = await p.clinic.findMany({
    include: {
      governorate: true,
      city: true
    }
  });
  console.log('Total clinics found:', clinics.length);
  for (const c of clinics) {
    console.log(`- ID: ${c.id}, Name: ${c.name}, Governorate: ${c.governorate?.nameAr}, City: ${c.city?.nameAr}, Address: ${c.address}`);
  }
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
