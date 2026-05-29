const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    where: { email: 'doctor@clinicpro.com' },
    data: { password: hash }
  });
  console.log('Successfully set password for doctor@clinicpro.com to password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
