const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'doctor@clinic.com' },
    data: { password: hash }
  });
  console.log('Password successfully encrypted and updated!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
