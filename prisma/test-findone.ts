import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all users in database...');
  const users = await prisma.user.findMany();
  console.log('Total users found:', users.length);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Clinic ID: ${u.clinicId}`);
  }
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

