const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'owner@clinicpro.online';
  
  // Clean up any existing owner record to allow safe re-runs
  await prisma.user.deleteMany({
    where: { email }
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  const u = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'ClinicPro Platform Owner',
      role: 'PLATFORM_OWNER',
    },
  });
  
  console.log('Created Platform Owner credentials successfully with Bcrypt Hash:');
  console.log('Email:', u.email);
  console.log('Password: password123');
  console.log('Role:', u.role);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
